using System.Collections.Generic;
using UnityEngine;

namespace StrikeDungeon
{
    /// <summary>Pin formations. x = sideways, y = distance behind the head pin.</summary>
    public static class Layouts
    {
        public static List<Vector2> Rows(int[] counts, float spacing)
        {
            var list = new List<Vector2>();
            for (int r = 0; r < counts.Length; r++)
            {
                int n = counts[r];
                for (int i = 0; i < n; i++)
                    list.Add(new Vector2((i - (n - 1) / 2f) * spacing, r * spacing * 0.866f));
            }
            return list;
        }

        public static List<Vector2> Triangle(int rows, float spacing)
        {
            var c = new int[rows];
            for (int i = 0; i < rows; i++) c[i] = i + 1;
            return Rows(c, spacing);
        }

        public static List<Vector2> Diamond() => Rows(new[] { 1, 2, 3, 2, 1 }, 0.48f);
        public static List<Vector2> Wall() => Rows(new[] { 5, 4 }, 0.4f);

        public static List<Vector2> Twin()
        {
            var list = new List<Vector2>();
            foreach (float side in new[] { -1f, 1f })
            {
                list.Add(new Vector2(0.55f * side, 0f));
                list.Add(new Vector2(0.35f * side, 0.35f));
                list.Add(new Vector2(0.75f * side, 0.35f));
                list.Add(new Vector2(0.55f * side, 0.7f));
            }
            return list;
        }

        public static List<Vector2> Scatter(int n)
        {
            var list = new List<Vector2>();
            for (int tries = 0; tries < 500 && list.Count < n; tries++)
            {
                var p = new Vector2(Random.Range(-0.7f, 0.7f), Random.Range(0f, 1.6f));
                bool ok = true;
                foreach (var q in list) if ((p - q).sqrMagnitude < 0.33f * 0.33f) { ok = false; break; }
                if (ok) list.Add(p);
            }
            return list;
        }

        public static List<Vector2> ForStage(int stage, bool boss)
        {
            if (boss) return Triangle(5, 0.42f);
            if (stage <= 2) return Triangle(4, 0.5f);
            switch (Random.Range(0, 5))
            {
                case 0: return Triangle(4, 0.5f);
                case 1: return Diamond();
                case 2: return Wall();
                case 3: return Twin();
                default: return Scatter(10);
            }
        }
    }
}
