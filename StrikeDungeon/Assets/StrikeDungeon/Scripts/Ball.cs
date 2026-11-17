using UnityEngine;

namespace StrikeDungeon
{
    public class Ball : MonoBehaviour
    {
        public Rigidbody rb;
        public Collider col;
        public bool launched;
        public bool isClone;
        public bool firstHit;
        public float hook;
        float time;
        StrikeGame game;

        public static Ball Create(StrikeGame game, Vector3 pos, float radius, float mass, bool clone)
        {
            var go = Factory.Prim(PrimitiveType.Sphere, clone ? "BallClone" : "Ball", null, pos,
                                  Vector3.one * radius * 2f, clone ? game.CloneColor : game.BallColor, true);
            var b = go.AddComponent<Ball>();
            b.game = game;
            b.isClone = clone;
            b.col = go.GetComponent<Collider>();
            b.col.sharedMaterial = game.BallPhys;

            var rb = go.AddComponent<Rigidbody>();
            rb.mass = mass;
            rb.isKinematic = true;
            rb.collisionDetectionMode = CollisionDetectionMode.ContinuousDynamic;
            rb.interpolation = RigidbodyInterpolation.Interpolate;
            rb.linearDamping = 0.02f;
            rb.angularDamping = 0.05f;
            rb.maxAngularVelocity = 60f;
            b.rb = rb;
            return b;
        }

        public void Launch(Vector3 velocity, float hookAmount)
        {
            rb.isKinematic = false;
            rb.linearVelocity = velocity;
            float r = transform.localScale.x * 0.5f;
            // Start already rolling forward (spin about +x matches motion along +z).
            rb.angularVelocity = new Vector3(velocity.z / r, 0f, -velocity.x / r);
            hook = hookAmount;
            launched = true;
        }

        void FixedUpdate()
        {
            if (!launched) return;
            time += Time.fixedDeltaTime;
            var p = transform.position;
            bool onLane = Mathf.Abs(p.x) < StrikeGame.LaneHalf && p.y > -0.05f;
            if (!onLane || p.z > game.PinHeadZ - 0.3f) return;

            if (hook != 0f)
                rb.AddForce(Vector3.right * hook * game.HookAccel, ForceMode.Acceleration);

            int mag = game.Run != null ? game.Run.Level(UpgradeId.MagnetBall) : 0;
            if (mag > 0 && p.z > 3f)
            {
                float? tx = game.NearestStandingPinX(p);
                if (tx.HasValue)
                    rb.AddForce(Vector3.right * Mathf.Clamp((tx.Value - p.x) * 3f, -1f, 1f) * mag * 1.2f,
                                ForceMode.Acceleration);
            }
        }

        void OnCollisionEnter(Collision c)
        {
            if (!launched || firstHit) return;
            if (c.collider.GetComponentInParent<Pin>() == null) return;
            firstHit = true;
            game.OnBallFirstPinHit(this, c.GetContact(0).point);
        }

        public bool Done
        {
            get
            {
                var p = transform.position;
                return time > 8f || p.y < -1.5f || p.z > game.LaneEndZ + 0.6f ||
                       (time > 1f && rb.linearVelocity.magnitude < 0.2f);
            }
        }
    }
}
