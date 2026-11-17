using UnityEngine;

namespace StrikeDungeon
{
    public class Pin : MonoBehaviour
    {
        public Rigidbody rb;
        public bool knocked;
        public bool heavy;
        StrikeGame game;

        public static Pin Create(StrikeGame game, Transform parent, Vector3 pos, bool heavy)
        {
            var root = new GameObject(heavy ? "HeavyPin" : "Pin");
            root.transform.SetParent(parent, false);
            root.transform.position = pos;

            Color bodyCol = heavy ? new Color(0.22f, 0.22f, 0.3f) : Color.white;
            Color stripeCol = heavy ? new Color(1f, 0.75f, 0.1f) : new Color(0.92f, 0.15f, 0.2f);

            // Body: cylinder 0.64 tall. Convex MeshCollider gives a flat base so pins stand still.
            var body = Factory.Prim(PrimitiveType.Cylinder, "Body", root.transform, new Vector3(0f, 0.32f, 0f),
                                    new Vector3(0.2f, 0.32f, 0.2f), bodyCol, false);
            var mc = body.AddComponent<MeshCollider>();
            mc.sharedMesh = body.GetComponent<MeshFilter>().sharedMesh;
            mc.convex = true;
            mc.sharedMaterial = game.PinPhys;

            Factory.Prim(PrimitiveType.Cylinder, "Stripe", root.transform, new Vector3(0f, 0.5f, 0f),
                         new Vector3(0.21f, 0.03f, 0.21f), stripeCol, false);
            Factory.Prim(PrimitiveType.Sphere, "Head", root.transform, new Vector3(0f, 0.66f, 0f),
                         Vector3.one * 0.16f, bodyCol, false);

            var pin = root.AddComponent<Pin>();
            pin.game = game;
            pin.heavy = heavy;

            var rb = root.AddComponent<Rigidbody>();
            rb.mass = heavy ? 5f : 1.5f;
            rb.centerOfMass = new Vector3(0f, 0.24f, 0f);
            rb.collisionDetectionMode = CollisionDetectionMode.ContinuousSpeculative;
            rb.maxDepenetrationVelocity = 3f;
            rb.linearDamping = 0.1f;
            rb.angularDamping = 0.3f;
            rb.Sleep();
            pin.rb = rb;
            return pin;
        }

        void FixedUpdate()
        {
            if (knocked) return;
            var p = transform.position;
            if (Vector3.Angle(transform.up, Vector3.up) > 28f || p.y < -0.15f ||
                Mathf.Abs(p.x) > StrikeGame.LaneHalf + 0.02f || p.z > game.LaneEndZ)
            {
                knocked = true;
                game.OnPinKnocked(this);
            }
        }

        void OnCollisionEnter(Collision c)
        {
            float v = c.relativeVelocity.magnitude;
            if (v > 1.2f) game.Sfx.Hit(v);
        }
    }
}
