using System.Collections.Generic;
using UnityEngine;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif

namespace StrikeDungeon
{
    /// <summary>
    /// Strike Dungeon - bowling roguelite prototype.
    /// Builds the whole game at runtime (lane, pins, camera, light, UI), so it runs in any empty scene.
    /// Loop: stage -> swipe to bowl -> reach the target score -> pick 1 of 3 power-ups -> harder stage.
    /// </summary>
    public class StrikeGame : MonoBehaviour
    {
        // ---------- Tuning ----------
        public const float LaneHalf = 0.9f;
        public float PinHeadZ = 12f;
        public float LaneEndZ = 14.4f;
        public float HookAccel = 1.3f;
        public float MinThrowSpeed = 6.5f;
        public float MaxThrowSpeed = 12f;
        public int StartLives = 3;

        public Color BallColor = new Color(0.15f, 0.7f, 1f);
        public Color CloneColor = new Color(1f, 0.5f, 0.85f);

        public RunState Run { get; private set; }
        public Sfx Sfx { get; private set; }
        public PhysicsMaterial BallPhys { get; private set; }
        public PhysicsMaterial PinPhys { get; private set; }
        PhysicsMaterial lanePhys;

        enum State { Title, Aiming, Rolling, Settling, Banner, Upgrade, GameOver }
        State state = State.Title;

        Camera cam;
        Transform pinRoot, obstacleRoot;
        readonly List<Pin> pins = new List<Pin>();
        readonly List<Ball> balls = new List<Ball>();
        readonly List<GameObject> obstacles = new List<GameObject>();
        Ball mainBall;
        GameObject aimArrow;

        List<Vector2> layout;
        int heavyCount;
        int rollsLeft, rollIndex, stageScore, target;
        bool isBoss, strikeFxDone;
        float stateTimer, bannerDuration;
        System.Action afterBanner;
        List<UpgradeDef> choices;
        int best;

        // input
        bool wasPressed, swipeLocked;
        Vector2 pressStart, swipeStart;
        float swipeStartTime, ballXAtPress;
        readonly List<Vector2> samples = new List<Vector2>();

        // juice
        string flashText; Color flashColor; float flashStart = -10f, flashDur;
        string popText; float popStart = -10f;
        float shake, slowMoUntil = -1f;
        Vector3 camPos, camLook;

        static readonly Vector3 CamBase = new Vector3(0f, 2.1f, -2.4f);

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void AutoBoot()
        {
            if (FindAnyObjectByType<StrikeGame>() == null)
                new GameObject("StrikeGame").AddComponent<StrikeGame>();
        }

        // =====================================================================
        // Setup
        // =====================================================================
        void Start()
        {
            Application.targetFrameRate = 60;
            Time.fixedDeltaTime = 0.01f;
            Physics.defaultSolverIterations = 12;
            Physics.defaultSolverVelocityIterations = 4;
            best = PlayerPrefs.GetInt("sd_best", 0);

            BallPhys = Factory.PhysMat("Ball", 0.15f, 0.1f);
            PinPhys = Factory.PhysMat("Pin", 0.4f, 0.35f);
            lanePhys = Factory.PhysMat("Lane", 0.15f, 0.05f);

            SetupCameraAndLight();
            Sfx = cam.gameObject.AddComponent<Sfx>();
            BuildLane();

            pinRoot = new GameObject("Pins").transform;
            obstacleRoot = new GameObject("Obstacles").transform;

            aimArrow = Factory.Prim(PrimitiveType.Cube, "AimArrow", null, Vector3.zero,
                                    new Vector3(0.05f, 0.01f, 1.4f), new Color(1f, 1f, 1f), false);
            aimArrow.SetActive(false);

            layout = Layouts.Triangle(4, 0.5f);
            SpawnPins();
            camPos = CamBase;
            camLook = new Vector3(0f, 0f, 7.5f);
            state = State.Title;
        }

        void SetupCameraAndLight()
        {
            cam = Camera.main;
            if (cam == null)
            {
                var go = new GameObject("Main Camera") { tag = "MainCamera" };
                cam = go.AddComponent<Camera>();
                go.AddComponent<AudioListener>();
            }
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = new Color(0.16f, 0.12f, 0.28f);
            cam.fieldOfView = 55f;
            cam.nearClipPlane = 0.05f;
            cam.farClipPlane = 100f;

            Light sun = null;
            foreach (var l in FindObjectsByType<Light>(FindObjectsSortMode.None))
                if (l.type == LightType.Directional) { sun = l; break; }
            if (sun == null)
            {
                sun = new GameObject("Sun").AddComponent<Light>();
                sun.type = LightType.Directional;
            }
            sun.transform.rotation = Quaternion.Euler(55f, -25f, 0f);
            sun.intensity = 1.2f;
            sun.color = new Color(1f, 0.96f, 0.9f);
            sun.shadows = LightShadows.Soft;

            RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Flat;
            RenderSettings.ambientLight = new Color(0.55f, 0.5f, 0.65f);
        }

        void BuildLane()
        {
            var root = new GameObject("Lane").transform;
            float start = -1.5f;
            float len = LaneEndZ - start;
            float zc = (LaneEndZ + start) * 0.5f;

            var wood = new Color(0.93f, 0.72f, 0.45f);
            var gutter = new Color(0.25f, 0.22f, 0.35f);
            var wall = new Color(1f, 0.45f, 0.6f);
            var dark = new Color(0.45f, 0.28f, 0.18f);

            // Lane floor (top surface at y = 0)
            var floor = Factory.Prim(PrimitiveType.Cube, "LaneFloor", root, new Vector3(0f, -0.1f, zc),
                                     new Vector3(LaneHalf * 2f, 0.2f, len), wood, true);
            floor.GetComponent<Collider>().sharedMaterial = lanePhys;

            // Pin deck tint (visual only)
            float deckStart = PinHeadZ - 0.6f;
            Factory.Prim(PrimitiveType.Cube, "PinDeck", root, new Vector3(0f, 0.001f, (deckStart + LaneEndZ) * 0.5f),
                         new Vector3(LaneHalf * 2f, 0.002f, LaneEndZ - deckStart), new Color(0.98f, 0.85f, 0.62f), false);

            foreach (float side in new[] { -1f, 1f })
            {
                Factory.Prim(PrimitiveType.Cube, "Gutter", root, new Vector3(side * (LaneHalf + 0.15f), -0.18f, zc),
                             new Vector3(0.3f, 0.2f, len), gutter, true);
                Factory.Prim(PrimitiveType.Cube, "Wall", root, new Vector3(side * (LaneHalf + 0.36f), 0.05f, zc),
                             new Vector3(0.12f, 0.45f, len), wall, true);
                // decorative pillars
                for (float z = 1f; z < LaneEndZ; z += 3f)
                {
                    Factory.Prim(PrimitiveType.Cube, "Pillar", root, new Vector3(side * 2.3f, 0.3f, z),
                                 new Vector3(0.4f, 1.6f, 0.4f), new Color(0.35f, 0.25f, 0.55f), false);
                    Factory.Prim(PrimitiveType.Cube, "PillarTop", root, new Vector3(side * 2.3f, 1.2f, z),
                                 new Vector3(0.5f, 0.2f, 0.5f), new Color(1f, 0.8f, 0.3f), false);
                }
            }

            // Foul line + aiming arrows
            Factory.Prim(PrimitiveType.Cube, "FoulLine", root, new Vector3(0f, 0.001f, 0.15f),
                         new Vector3(LaneHalf * 2f, 0.002f, 0.04f), dark, false);
            for (int i = -2; i <= 2; i++)
            {
                var a = Factory.Prim(PrimitiveType.Cube, "Arrow", root,
                                     new Vector3(i * 0.3f, 0.001f, 4.5f - Mathf.Abs(i) * 0.35f),
                                     new Vector3(0.09f, 0.002f, 0.09f), dark, false);
                a.transform.localRotation = Quaternion.Euler(0f, 45f, 0f);
            }

            // Pit behind the pins + back wall + masking unit
            Factory.Prim(PrimitiveType.Cube, "PitFloor", root, new Vector3(0f, -1f, LaneEndZ + 1.25f),
                         new Vector3(3f, 0.2f, 2.5f), gutter, true);
            Factory.Prim(PrimitiveType.Cube, "BackWall", root, new Vector3(0f, 0f, LaneEndZ + 2.5f),
                         new Vector3(3f, 2.4f, 0.2f), new Color(0.2f, 0.16f, 0.3f), true);
            Factory.Prim(PrimitiveType.Cube, "Masking", root, new Vector3(0f, 1.45f, LaneEndZ + 0.2f),
                         new Vector3(2.9f, 0.6f, 0.2f), new Color(0.3f, 0.75f, 0.95f), false);

            // Ground far below so the world isn't floating in the void
            Factory.Prim(PrimitiveType.Cube, "Ground", root, new Vector3(0f, -1.2f, zc),
                         new Vector3(12f, 0.2f, len + 10f), new Color(0.22f, 0.17f, 0.36f), false);
        }

        // =====================================================================
        // Run / stage flow
        // =====================================================================
        void NewRun()
        {
            Run = new RunState { lives = StartLives };
            StartStage(1);
        }

        void StartStage(int stage)
        {
            ClearStage();
            Run.stage = stage;
            isBoss = stage % 5 == 0;
            layout = Layouts.ForStage(stage, isBoss);
            heavyCount = isBoss ? 3 : 0;
            SpawnPins();

            int obstacleCount = isBoss ? 1 : stage >= 7 ? 2 : stage >= 3 ? 1 : 0;
            if (stage >= 10) obstacleCount++;
            for (int i = 0; i < obstacleCount; i++)
            {
                float z = 6.5f + i * 2.2f;
                var o = MovingObstacle.Create(obstacleRoot, z, Random.Range(1f, 1.9f), Random.Range(0f, 6.28f));
                obstacles.Add(o.gameObject);
            }

            // Target grows each stage; upgrades are what let you keep up.
            target = Mathf.RoundToInt(layout.Count * 0.7f + (stage - 1) * 1.4f) + (isBoss ? 3 : 0);
            stageScore = 0;
            rollIndex = 0;
            rollsLeft = Run.Rolls;
            ResetBall();
            Flash(isBoss ? "BOSS STAGE!" : "STAGE " + stage, isBoss ? new Color(1f, 0.4f, 0.4f) : Color.white, 1.2f);
            state = State.Aiming;
        }

        void ClearStage()
        {
            foreach (var p in pins) if (p) Destroy(p.gameObject);
            pins.Clear();
            foreach (var o in obstacles) if (o) Destroy(o);
            obstacles.Clear();
            foreach (var b in balls) if (b) Destroy(b.gameObject);
            balls.Clear();
            mainBall = null;
        }

        void SpawnPins()
        {
            var heavy = new HashSet<int>();
            while (heavy.Count < Mathf.Min(heavyCount, layout.Count))
                heavy.Add(Random.Range(0, layout.Count));
            for (int i = 0; i < layout.Count; i++)
            {
                var v = layout[i];
                pins.Add(Pin.Create(this, pinRoot, new Vector3(v.x, 0.002f, PinHeadZ + v.y), heavy.Contains(i)));
            }
            strikeFxDone = false;
        }

        void ResetBall()
        {
            foreach (var b in balls) if (b) Destroy(b.gameObject);
            balls.Clear();
            float r = Run.BallRadius;
            mainBall = Ball.Create(this, new Vector3(0f, r + 0.005f, 0.6f), r, Run.BallMass, false);
            balls.Add(mainBall);
        }

        void ResolveRoll()
        {
            int knocked = 0;
            foreach (var p in pins) if (p.knocked) knocked++;
            int standing = pins.Count - knocked;

            bool strike = rollIndex == 0 && standing == 0 && knocked > 0;
            bool spare = rollIndex > 0 && standing == 0 && knocked > 0;

            float mult = 1f;
            if (strike)
            {
                Run.strikeStreak++;
                mult = 1f + Run.ComboPerStrike * (Run.strikeStreak - 1);
            }
            else if (rollIndex == 0)
            {
                Run.strikeStreak = 0;
            }

            int pts = Mathf.RoundToInt(knocked * Run.PinValue * mult);
            int bonus = strike ? Run.StrikeBonus : spare ? Run.SpareBonus : 0;
            stageScore += pts + bonus;

            if (strike) Flash(mult > 1f ? "STRIKE! x" + mult.ToString("0.#") : "STRIKE!", new Color(1f, 0.85f, 0.2f), 1.1f);
            else if (spare) Flash("SPARE!", new Color(0.4f, 1f, 0.6f), 1f);
            else if (knocked == 0) Flash("MISS", new Color(0.7f, 0.7f, 0.8f), 0.8f);
            if (pts + bonus > 0) { popText = "+" + (pts + bonus); popStart = Time.unscaledTime; }

            for (int i = pins.Count - 1; i >= 0; i--)
            {
                if (!pins[i].knocked) continue;
                Destroy(pins[i].gameObject);
                pins.RemoveAt(i);
            }

            rollIndex++;
            rollsLeft--;

            if (stageScore >= target) { EndStage(true); return; }
            if (rollsLeft <= 0) { EndStage(false); return; }
            if (pins.Count == 0)
            {
                // Cleared the deck with balls to spare: fresh rack, strikes possible again.
                SpawnPins();
                rollIndex = 0;
                Flash("RE-RACK!", new Color(0.6f, 0.9f, 1f), 0.9f);
            }
            ResetBall();
            state = State.Aiming;
        }

        void EndStage(bool cleared)
        {
            if (cleared)
            {
                Run.totalScore += stageScore;
                if (Run.stage > best) { best = Run.stage; PlayerPrefs.SetInt("sd_best", best); PlayerPrefs.Save(); }
                Confetti.Spawn(new Vector3(0f, 0.5f, PinHeadZ), 25);
                ShowBanner("STAGE CLEAR!", new Color(0.4f, 1f, 0.6f), 1.3f, () =>
                {
                    choices = Upgrades.RollChoices(Run, 3);
                    if (choices.Count == 0) StartStage(Run.stage + 1);
                    else state = State.Upgrade;
                });
            }
            else
            {
                Run.lives--;
                Run.strikeStreak = 0;
                if (Run.lives <= 0)
                    ShowBanner("OUT OF HEARTS", new Color(1f, 0.35f, 0.35f), 1.5f, () => state = State.GameOver);
                else
                    ShowBanner("FAILED  -1 ♥", new Color(1f, 0.35f, 0.35f), 1.3f, () => StartStage(Run.stage));
            }
        }

        void ShowBanner(string text, Color c, float dur, System.Action then)
        {
            Flash(text, c, dur);
            bannerDuration = dur;
            afterBanner = then;
            stateTimer = 0f;
            state = State.Banner;
        }

        void PickUpgrade(UpgradeDef def)
        {
            Run.AddLevel(def.id);
            Sfx.Click();
            StartStage(Run.stage + 1);
        }

        // =====================================================================
        // Events from pins / balls
        // =====================================================================
        public void OnPinKnocked(Pin pin)
        {
            if (Run == null || (state != State.Rolling && state != State.Settling)) return;

            int ex = Run.Level(UpgradeId.ExplosivePins);
            if (ex > 0)
                Explode(pin.transform.position + Vector3.up * 0.3f, 0.55f + 0.12f * ex, 2.5f + 1.5f * ex,
                        new Color(1f, 0.55f, 0.15f));

            if (rollIndex == 0 && !strikeFxDone && AllKnocked())
            {
                strikeFxDone = true;
                Time.timeScale = 0.35f;
                slowMoUntil = Time.unscaledTime + 0.55f;
                shake = Mathf.Max(shake, 0.18f);
                Sfx.Strike();
                Confetti.Spawn(new Vector3(0f, 0.6f, PinHeadZ + 0.6f), 40);
            }
        }

        public void OnBallFirstPinHit(Ball ball, Vector3 point)
        {
            if (Run == null) return;
            shake = Mathf.Max(shake, 0.06f);

            int sw = Run.Level(UpgradeId.Shockwave);
            if (sw > 0)
                Explode(point, 0.7f + 0.25f * sw, 3f + 2f * sw, new Color(0.3f, 0.9f, 1f));

            int sp = Run.Level(UpgradeId.SplitBall);
            if (sp > 0 && !ball.isClone)
            {
                Vector3 v = ball.rb.linearVelocity;
                float r = ball.transform.localScale.x * 0.5f;
                for (int i = 0; i < sp; i++)
                {
                    float sign = i % 2 == 0 ? 1f : -1f;
                    float ang = sign * (16f + 8f * (i / 2));
                    Vector3 offset = Vector3.right * sign * r * 2.1f;
                    var nb = Ball.Create(this, ball.transform.position + offset, r, Run.BallMass * 0.7f, true);
                    nb.firstHit = true; // clones don't re-trigger split/shockwave
                    foreach (var other in balls) Physics.IgnoreCollision(nb.col, other.col);
                    nb.Launch(Quaternion.Euler(0f, ang, 0f) * v * 0.95f, 0f);
                    balls.Add(nb);
                }
                Burst.Spawn(ball.transform.position, CloneColor, 0.6f);
            }
        }

        void Explode(Vector3 pos, float radius, float force, Color c)
        {
            Burst.Spawn(pos, c, radius * 1.4f);
            Sfx.Boom();
            shake = Mathf.Max(shake, 0.12f);
            var done = new HashSet<Rigidbody>();
            foreach (var col in Physics.OverlapSphere(pos, radius))
            {
                var rb = col.attachedRigidbody;
                if (rb == null || rb.isKinematic || done.Contains(rb) || rb.GetComponent<Ball>() != null) continue;
                done.Add(rb);
                rb.WakeUp();
                rb.AddExplosionForce(force, pos, radius, 0.4f, ForceMode.Impulse);
            }
        }

        bool AllKnocked()
        {
            if (pins.Count == 0) return false;
            foreach (var p in pins) if (!p.knocked) return false;
            return true;
        }

        public float? NearestStandingPinX(Vector3 from)
        {
            float bestScore = float.MaxValue;
            float? bestX = null;
            foreach (var p in pins)
            {
                if (p == null || p.knocked) continue;
                var pp = p.transform.position;
                if (pp.z < from.z) continue;
                float s = Mathf.Abs(pp.x - from.x) + (pp.z - from.z) * 0.2f;
                if (s < bestScore) { bestScore = s; bestX = pp.x; }
            }
            return bestX;
        }

        // =====================================================================
        // Update / input
        // =====================================================================
        void Update()
        {
            if (slowMoUntil > 0f && Time.unscaledTime > slowMoUntil)
            {
                Time.timeScale = 1f;
                slowMoUntil = -1f;
            }

            bool pressed = ReadPointer(out Vector2 pos);

            switch (state)
            {
                case State.Aiming:
                    HandleAiming(pressed, pos);
                    break;

                case State.Rolling:
                    stateTimer += Time.deltaTime;
                    bool allDone = true;
                    foreach (var b in balls) if (b && !b.Done) { allDone = false; break; }
                    if (allDone) { state = State.Settling; stateTimer = 0f; }
                    break;

                case State.Settling:
                    stateTimer += Time.deltaTime;
                    if (stateTimer > (AllKnocked() ? 0.7f : 1.4f)) ResolveRoll();
                    break;

                case State.Banner:
                    stateTimer += Time.unscaledDeltaTime;
                    if (stateTimer > bannerDuration) { var a = afterBanner; afterBanner = null; a?.Invoke(); }
                    break;
            }

            wasPressed = pressed;
        }

        void HandleAiming(bool pressed, Vector2 pos)
        {
            if (mainBall == null) return;
            float r = mainBall.transform.localScale.x * 0.5f;

            if (pressed && !wasPressed)
            {
                pressStart = pos;
                swipeLocked = false;
                ballXAtPress = mainBall.transform.position.x;
                samples.Clear();
            }

            if (pressed)
            {
                if (!swipeLocked)
                {
                    if (pos.y - pressStart.y > Screen.height * 0.025f)
                    {
                        swipeLocked = true;
                        swipeStart = pos;
                        swipeStartTime = Time.unscaledTime;
                        samples.Clear();
                        samples.Add(pos);
                    }
                    else
                    {
                        // Drag sideways to position the ball before the throw.
                        float x = ballXAtPress + (pos.x - pressStart.x) / Screen.width * 3f;
                        x = Mathf.Clamp(x, -LaneHalf + r, LaneHalf - r);
                        var bp = mainBall.transform.position;
                        mainBall.transform.position = new Vector3(x, bp.y, bp.z);
                    }
                }
                else
                {
                    samples.Add(pos);
                    UpdateAimArrow(pos - swipeStart);
                }
            }
            else if (wasPressed && swipeLocked)
            {
                swipeLocked = false;
                aimArrow.SetActive(false);
                TryLaunch();
            }
        }

        void UpdateAimArrow(Vector2 total)
        {
            if (total.y < Screen.height * 0.02f) { aimArrow.SetActive(false); return; }
            float aim = Mathf.Clamp(total.x / total.y * 0.5f, -0.28f, 0.28f);
            var dir = new Vector3(aim, 0f, 1f).normalized;
            aimArrow.SetActive(true);
            aimArrow.transform.position = mainBall.transform.position + dir * 1.0f + Vector3.down * (mainBall.transform.position.y - 0.01f);
            aimArrow.transform.rotation = Quaternion.LookRotation(dir);
        }

        void TryLaunch()
        {
            if (samples.Count < 2) return;
            Vector2 end = samples[samples.Count - 1];
            Vector2 total = end - swipeStart;
            if (total.y < Screen.height * 0.06f) return; // too short: ignore

            float dur = Mathf.Max(Time.unscaledTime - swipeStartTime, 0.04f);
            float aim = Mathf.Clamp(total.x / total.y * 0.5f, -0.28f, 0.28f);
            float swipeSpeed = total.magnitude / Screen.height / dur; // screen heights per second
            float speed = Mathf.Lerp(MinThrowSpeed, MaxThrowSpeed, Mathf.InverseLerp(0.6f, 3.5f, swipeSpeed)) * Run.SpeedMul;
            float hook = ComputeHook(swipeStart, end);

            mainBall.Launch(new Vector3(aim, 0f, 1f).normalized * speed, hook);
            Sfx.Throw();
            state = State.Rolling;
            stateTimer = 0f;
        }

        /// <summary>A curved swipe gives the ball hook. Bowing right ")" hooks left, bowing left "(" hooks right.</summary>
        float ComputeHook(Vector2 a, Vector2 b)
        {
            Vector2 ab = b - a;
            float len = ab.magnitude;
            if (len < 1f) return 0f;
            Vector2 u = ab / len;
            float bestCross = 0f;
            foreach (var p in samples)
            {
                Vector2 ap = p - a;
                float cross = u.x * ap.y - u.y * ap.x;
                if (Mathf.Abs(cross) > Mathf.Abs(bestCross)) bestCross = cross;
            }
            float h = bestCross / len * 5f;
            if (Mathf.Abs(h) < 0.12f) h = 0f;
            return Mathf.Clamp(h, -1f, 1f);
        }

        static bool ReadPointer(out Vector2 pos)
        {
#if ENABLE_INPUT_SYSTEM
            var p = Pointer.current;
            if (p == null) { pos = default; return false; }
            pos = p.position.ReadValue();
            return p.press.isPressed;
#else
            pos = Input.mousePosition;
            return Input.GetMouseButton(0);
#endif
        }

        // =====================================================================
        // Camera
        // =====================================================================
        void LateUpdate()
        {
            Vector3 targetPos = CamBase;
            Vector3 look = new Vector3(0f, 0f, 7.5f);

            if ((state == State.Rolling || state == State.Settling) && mainBall != null)
            {
                float maxZ = PinHeadZ - 3.5f;
                var bp = mainBall.transform.position;
                float bz = Mathf.Clamp(bp.z, 0f, maxZ);
                targetPos = CamBase + new Vector3(Mathf.Clamp(bp.x, -LaneHalf, LaneHalf) * 0.3f, -0.4f * (bz / maxZ), bz);
                look = new Vector3(0f, 0f, Mathf.Min(bz + 7.5f, PinHeadZ + 0.5f));
            }

            float k = 1f - Mathf.Exp(-5f * Time.unscaledDeltaTime);
            camPos = Vector3.Lerp(camPos, targetPos, k);
            camLook = Vector3.Lerp(camLook, look, k);

            shake = Mathf.Max(0f, shake - Time.unscaledDeltaTime * 0.5f);
            Vector3 shakeOffset = shake > 0f ? Random.insideUnitSphere * shake : Vector3.zero;
            cam.transform.position = camPos + shakeOffset;
            cam.transform.LookAt(camLook);
        }

        void Flash(string text, Color c, float dur)
        {
            flashText = text; flashColor = c; flashDur = dur; flashStart = Time.unscaledTime;
        }

        // =====================================================================
        // UI (IMGUI: zero setup, good enough for a prototype)
        // =====================================================================
        GUIStyle sBig, sMid, sSmall, sCardTitle, sCardBody, sButton;

        void EnsureStyles()
        {
            if (sBig != null) return;
            sBig = new GUIStyle(GUI.skin.label) { fontSize = 72, fontStyle = FontStyle.Bold, alignment = TextAnchor.MiddleCenter, wordWrap = false };
            sBig.normal.textColor = Color.white;
            sMid = new GUIStyle(sBig) { fontSize = 40 };
            sSmall = new GUIStyle(sBig) { fontSize = 26, fontStyle = FontStyle.Normal, wordWrap = true };
            sButton = new GUIStyle(sBig) { fontSize = 46 };
            sCardTitle = new GUIStyle(sBig) { fontSize = 40, alignment = TextAnchor.UpperLeft };
            sCardBody = new GUIStyle(sSmall) { fontSize = 28, alignment = TextAnchor.UpperLeft };
        }

        static void Box(Rect r, Color c)
        {
            var old = GUI.color;
            GUI.color = c;
            GUI.DrawTexture(r, Texture2D.whiteTexture);
            GUI.color = old;
        }

        static void Label(Rect r, string text, GUIStyle st, Color c)
        {
            var old = st.normal.textColor;
            st.normal.textColor = new Color(0f, 0f, 0f, c.a * 0.55f);
            GUI.Label(new Rect(r.x + 3f, r.y + 3f, r.width, r.height), text, st);
            st.normal.textColor = c;
            GUI.Label(r, text, st);
            st.normal.textColor = old;
        }

        bool Button(Rect r, string text, Color bg)
        {
            Box(r, bg);
            Label(r, text, sButton, Color.white);
            bool clicked = GUI.Button(r, GUIContent.none, GUIStyle.none);
            if (clicked) Sfx.Click();
            return clicked;
        }

        void OnGUI()
        {
            EnsureStyles();
            // Virtual 720x1280 portrait canvas, scaled to fit.
            float s = Mathf.Min(Screen.width / 720f, Screen.height / 1280f);
            GUI.matrix = Matrix4x4.Scale(new Vector3(s, s, 1f));
            float W = Screen.width / s, H = Screen.height / s;

            switch (state)
            {
                case State.Title: DrawTitle(W, H); break;
                case State.Upgrade: DrawHud(W, H); DrawUpgrade(W, H); break;
                case State.GameOver: DrawGameOver(W, H); break;
                default: DrawHud(W, H); break;
            }
            DrawFlash(W, H);
        }

        void DrawTitle(float W, float H)
        {
            Box(new Rect(0, 0, W, H), new Color(0.1f, 0.06f, 0.2f, 0.55f));
            Label(new Rect(0, H * 0.18f, W, 100), "STRIKE", sBig, new Color(1f, 0.85f, 0.25f));
            Label(new Rect(0, H * 0.18f + 90, W, 100), "DUNGEON", sBig, Color.white);
            Label(new Rect(0, H * 0.18f + 190, W, 50), "Bowling Roguelite", sMid, new Color(0.7f, 0.9f, 1f));
            if (best > 0) Label(new Rect(0, H * 0.18f + 250, W, 50), "Best: Stage " + best, sSmall, Color.white);
            if (Button(new Rect(W * 0.5f - 180, H * 0.62f, 360, 120), "PLAY", new Color(0.95f, 0.35f, 0.5f)))
                NewRun();
            Label(new Rect(60, H * 0.62f + 150, W - 120, 120),
                  "Drag sideways to move the ball.\nSwipe up to bowl. Curve your swipe to hook!", sSmall, Color.white);
        }

        void DrawHud(float W, float H)
        {
            if (Run == null) return;
            Box(new Rect(0, 0, W, 210), new Color(0f, 0f, 0f, 0.25f));
            Label(new Rect(24, 16, 300, 50), "STAGE " + Run.stage + (isBoss ? "  BOSS" : ""), sSmall,
                  isBoss ? new Color(1f, 0.5f, 0.5f) : Color.white);
            var hearts = new GUIStyle(sMid) { alignment = TextAnchor.MiddleRight };
            Label(new Rect(W - 324, 12, 300, 56), new string('♥', Mathf.Max(0, Run.lives)), hearts, new Color(1f, 0.3f, 0.4f));

            bool done = stageScore >= target;
            Label(new Rect(0, 60, W, 80), stageScore + " / " + target, sBig, done ? new Color(0.4f, 1f, 0.6f) : Color.white);

            float bw = W * 0.6f, bx = (W - bw) * 0.5f;
            Box(new Rect(bx, 145, bw, 18), new Color(1f, 1f, 1f, 0.2f));
            Box(new Rect(bx, 145, bw * Mathf.Clamp01(stageScore / (float)Mathf.Max(1, target)), 18), new Color(1f, 0.8f, 0.2f));
            Label(new Rect(0, 168, W, 36), "Balls left: " + rollsLeft + (Run.strikeStreak > 1 ? "    Streak x" + Run.strikeStreak : ""),
                  sSmall, new Color(0.85f, 0.9f, 1f));

            // Owned power-ups
            var sb = new System.Text.StringBuilder();
            foreach (var kv in Run.Owned)
            {
                if (sb.Length > 0) sb.Append("   ");
                sb.Append(Upgrades.Get(kv.Key).name).Append(' ').Append(kv.Value);
            }
            if (sb.Length > 0) Label(new Rect(20, H - 110, W - 40, 100), sb.ToString(), sSmall, new Color(1f, 1f, 1f, 0.85f));

            if (state == State.Aiming && Run.stage == 1 && rollIndex == 0)
                Label(new Rect(40, H - 260, W - 80, 120), "Swipe UP to bowl\nCurve the swipe to hook", sMid, new Color(1f, 1f, 1f, 0.9f));

            float popT = Time.unscaledTime - popStart;
            if (popT < 1f)
                Label(new Rect(0, H * 0.42f - popT * 60f, W, 80), popText, sBig, new Color(1f, 0.9f, 0.3f, 1f - popT));
        }

        void DrawUpgrade(float W, float H)
        {
            Box(new Rect(0, 0, W, H), new Color(0.05f, 0.03f, 0.12f, 0.75f));
            Label(new Rect(0, 230, W, 70), "CHOOSE A POWER-UP", sMid, new Color(1f, 0.85f, 0.3f));
            float cardH = 220f, gap = 30f, y = 330f;
            for (int i = 0; i < choices.Count; i++)
            {
                var c = choices[i];
                var r = new Rect(50, y + i * (cardH + gap), W - 100, cardH);
                Box(r, c.color * 0.85f + new Color(0, 0, 0, 0.15f));
                Box(new Rect(r.x, r.y, 14, r.height), Color.white);
                int lvl = Run.Level(c.id);
                Label(new Rect(r.x + 40, r.y + 24, r.width - 60, 60), c.name, sCardTitle, Color.white);
                Label(new Rect(r.x + 40, r.y + 88, r.width - 60, 80), c.desc, sCardBody, Color.white);
                Label(new Rect(r.x + 40, r.y + 160, r.width - 60, 40),
                      lvl == 0 ? "NEW" : "Lv " + lvl + "  →  " + (lvl + 1), sCardBody, new Color(1f, 1f, 0.7f));
                if (GUI.Button(r, GUIContent.none, GUIStyle.none)) { PickUpgrade(c); break; }
            }
        }

        void DrawGameOver(float W, float H)
        {
            Box(new Rect(0, 0, W, H), new Color(0.1f, 0.03f, 0.08f, 0.75f));
            Label(new Rect(0, H * 0.22f, W, 100), "RUN OVER", sBig, new Color(1f, 0.4f, 0.45f));
            Label(new Rect(0, H * 0.22f + 110, W, 60), "Reached stage " + Run.stage, sMid, Color.white);
            Label(new Rect(0, H * 0.22f + 170, W, 50), "Total score " + Run.totalScore + "     Best: stage " + best, sSmall, Color.white);
            if (Button(new Rect(W * 0.5f - 210, H * 0.6f, 420, 120), "PLAY AGAIN", new Color(0.95f, 0.35f, 0.5f)))
                NewRun();
        }

        void DrawFlash(float W, float H)
        {
            float t = Time.unscaledTime - flashStart;
            if (string.IsNullOrEmpty(flashText) || t > flashDur) return;
            float pop = t < 0.15f ? Mathf.Lerp(1.6f, 1f, t / 0.15f) : 1f;
            float alpha = t > flashDur - 0.3f ? (flashDur - t) / 0.3f : 1f;
            var old = GUI.matrix;
            var center = new Vector2(W * 0.5f, H * 0.33f);
            GUIUtility.ScaleAroundPivot(Vector2.one * pop, center);
            var c = flashColor; c.a = alpha;
            Label(new Rect(0, center.y - 60, W, 120), flashText, sBig, c);
            GUI.matrix = old;
        }
    }
}
