using UnityEngine;
using UnityEngine.Rendering;

namespace StrikeDungeon
{
    /// <summary>Expanding then shrinking sphere: explosions, shockwaves, splits.</summary>
    public class Burst : MonoBehaviour
    {
        float t, dur, size;

        public static void Spawn(Vector3 pos, Color c, float size, float dur = 0.35f)
        {
            var go = Factory.Prim(PrimitiveType.Sphere, "Burst", null, pos, Vector3.one * 0.05f, c, false);
            go.GetComponent<Renderer>().shadowCastingMode = ShadowCastingMode.Off;
            var b = go.AddComponent<Burst>();
            b.dur = dur; b.size = size;
        }

        void Update()
        {
            t += Time.unscaledDeltaTime;
            float k = t / dur;
            float s = k < 0.35f ? Mathf.Lerp(0.05f, size, k / 0.35f) : Mathf.Lerp(size, 0f, (k - 0.35f) / 0.65f);
            transform.localScale = Vector3.one * Mathf.Max(0f, s);
            if (t >= dur) Destroy(gameObject);
        }
    }

    /// <summary>Cheap confetti made of tiny cubes (no physics, no colliders).</summary>
    public class Confetti : MonoBehaviour
    {
        static readonly Color[] Palette =
        {
            new Color(1f, 0.85f, 0.2f), new Color(1f, 0.35f, 0.5f), new Color(0.3f, 0.85f, 1f),
            new Color(0.5f, 1f, 0.5f), new Color(0.8f, 0.5f, 1f)
        };

        Vector3 v, spin;
        float life, size;

        public static void Spawn(Vector3 pos, int n)
        {
            for (int i = 0; i < n; i++)
            {
                float s = Random.Range(0.05f, 0.09f);
                var go = Factory.Prim(PrimitiveType.Cube, "Confetti", null, pos, Vector3.one * s,
                                      Palette[Random.Range(0, Palette.Length)], false);
                go.GetComponent<Renderer>().shadowCastingMode = ShadowCastingMode.Off;
                var c = go.AddComponent<Confetti>();
                c.size = s;
                c.v = new Vector3(Random.Range(-2.5f, 2.5f), Random.Range(3f, 6.5f), Random.Range(-2f, 1f));
                c.spin = Random.insideUnitSphere * 720f;
                c.life = Random.Range(1.2f, 1.8f);
            }
        }

        void Update()
        {
            float dt = Time.unscaledDeltaTime;
            v += Physics.gravity * 0.6f * dt;
            transform.position += v * dt;
            transform.Rotate(spin * dt);
            life -= dt;
            if (life < 0.3f) transform.localScale = Vector3.one * size * Mathf.Max(0f, life / 0.3f);
            if (life <= 0f) Destroy(gameObject);
        }
    }
}
