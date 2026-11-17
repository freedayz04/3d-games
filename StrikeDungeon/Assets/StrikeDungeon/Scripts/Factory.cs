using System.Collections.Generic;
using UnityEngine;

namespace StrikeDungeon
{
    /// <summary>Builds everything from Unity primitives, so the prototype needs no art assets.
    /// Works with URP and the Built-in pipeline: materials are copies of the pipeline's default material.</summary>
    public static class Factory
    {
        static Material baseMat;
        static readonly Dictionary<Color, Material> cache = new Dictionary<Color, Material>();

        public static Material Mat(Color c)
        {
            if (baseMat == null)
            {
                var tmp = GameObject.CreatePrimitive(PrimitiveType.Cube);
                baseMat = tmp.GetComponent<Renderer>().sharedMaterial;
                Object.Destroy(tmp);
            }
            if (cache.TryGetValue(c, out var m) && m != null) return m;
            m = new Material(baseMat) { color = c };
            if (m.HasProperty("_Smoothness")) m.SetFloat("_Smoothness", 0.35f);
            if (m.HasProperty("_Glossiness")) m.SetFloat("_Glossiness", 0.35f);
            cache[c] = m;
            return m;
        }

        public static GameObject Prim(PrimitiveType type, string name, Transform parent, Vector3 localPos,
                                      Vector3 scale, Color color, bool keepCollider)
        {
            var go = GameObject.CreatePrimitive(type);
            go.name = name;
            if (parent != null) go.transform.SetParent(parent, false);
            go.transform.localPosition = localPos;
            go.transform.localScale = scale;
            go.GetComponent<Renderer>().sharedMaterial = Mat(color);
            if (!keepCollider) Object.DestroyImmediate(go.GetComponent<Collider>());
            return go;
        }

        public static PhysicsMaterial PhysMat(string name, float friction, float bounce)
        {
            return new PhysicsMaterial(name)
            {
                dynamicFriction = friction,
                staticFriction = friction,
                bounciness = bounce,
                frictionCombine = PhysicsMaterialCombine.Average,
                bounceCombine = PhysicsMaterialCombine.Average
            };
        }
    }
}
