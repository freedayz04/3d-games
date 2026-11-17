using UnityEngine;

namespace StrikeDungeon
{
    public class MovingObstacle : MonoBehaviour
    {
        public float range = 0.62f;
        public float speed = 1.3f;
        public float phase;
        float z;
        Rigidbody rb;

        public static MovingObstacle Create(Transform parent, float z, float speed, float phase)
        {
            var go = Factory.Prim(PrimitiveType.Cube, "Blocker", parent, new Vector3(0f, 0.2f, z),
                                  new Vector3(0.45f, 0.4f, 0.3f), new Color(0.55f, 0.3f, 0.95f), true);
            var rb = go.AddComponent<Rigidbody>();
            rb.isKinematic = true;
            rb.interpolation = RigidbodyInterpolation.Interpolate;
            var m = go.AddComponent<MovingObstacle>();
            m.rb = rb; m.z = z; m.speed = speed; m.phase = phase;
            return m;
        }

        void FixedUpdate()
        {
            float x = Mathf.Sin(Time.time * speed + phase) * range;
            rb.MovePosition(new Vector3(x, 0.2f, z));
        }
    }
}
