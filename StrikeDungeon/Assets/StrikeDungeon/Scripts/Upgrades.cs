using System.Collections.Generic;
using UnityEngine;

namespace StrikeDungeon
{
    public enum UpgradeId
    {
        HeavyBall, BigBall, PowerThrow, GoldenPins, StrikeMaster, ExtraRoll,
        ExplosivePins, SplitBall, Shockwave, MagnetBall, Combo, ExtraHeart
    }

    public class UpgradeDef
    {
        public readonly UpgradeId id;
        public readonly string name;
        public readonly string desc;
        public readonly int maxLevel;
        public readonly Color color;

        public UpgradeDef(UpgradeId id, string name, string desc, int maxLevel, Color color)
        {
            this.id = id; this.name = name; this.desc = desc; this.maxLevel = maxLevel; this.color = color;
        }
    }

    /// <summary>All state for one run. Every number the upgrades touch lives here, so balancing happens in one place.</summary>
    public class RunState
    {
        public int stage = 1;
        public int lives = 3;
        public int strikeStreak;
        public int totalScore;

        readonly Dictionary<UpgradeId, int> levels = new Dictionary<UpgradeId, int>();

        public int Level(UpgradeId id) => levels.TryGetValue(id, out var l) ? l : 0;
        public IEnumerable<KeyValuePair<UpgradeId, int>> Owned => levels;

        public void AddLevel(UpgradeId id)
        {
            levels[id] = Level(id) + 1;
            if (id == UpgradeId.ExtraHeart) lives++;
        }

        public float BallMass => 7f * (1f + 0.4f * Level(UpgradeId.HeavyBall));
        public float BallRadius => 0.18f * (1f + 0.18f * Level(UpgradeId.BigBall));
        public float SpeedMul => 1f + 0.15f * Level(UpgradeId.PowerThrow);
        public int PinValue => 1 + Level(UpgradeId.GoldenPins);
        public int StrikeBonus => 5 + 5 * Level(UpgradeId.StrikeMaster);
        public int SpareBonus => 3;
        public int Rolls => 2 + Level(UpgradeId.ExtraRoll);
        public float ComboPerStrike => 0.5f * Level(UpgradeId.Combo);
    }

    public static class Upgrades
    {
        public static readonly UpgradeDef[] All =
        {
            new UpgradeDef(UpgradeId.HeavyBall,     "Heavy Ball",     "+40% ball weight. Plows through pins.",            3, new Color(0.35f, 0.45f, 0.65f)),
            new UpgradeDef(UpgradeId.BigBall,       "Big Ball",       "+18% ball size. Harder to miss.",                   3, new Color(0.25f, 0.6f, 0.9f)),
            new UpgradeDef(UpgradeId.PowerThrow,    "Power Throw",    "+15% throw speed.",                                 3, new Color(0.95f, 0.55f, 0.2f)),
            new UpgradeDef(UpgradeId.GoldenPins,    "Golden Pins",    "+1 point for every pin.",                           5, new Color(0.95f, 0.75f, 0.1f)),
            new UpgradeDef(UpgradeId.StrikeMaster,  "Strike Master",  "+5 bonus points per Strike.",                       5, new Color(0.9f, 0.3f, 0.35f)),
            new UpgradeDef(UpgradeId.ExtraRoll,     "Extra Ball",     "+1 ball every stage.",                              2, new Color(0.3f, 0.75f, 0.45f)),
            new UpgradeDef(UpgradeId.ExplosivePins, "Explosive Pins", "Falling pins explode and knock neighbours.",         3, new Color(1f, 0.4f, 0.1f)),
            new UpgradeDef(UpgradeId.SplitBall,     "Split Ball",     "Ball splits on the first hit.",                     2, new Color(0.9f, 0.4f, 0.8f)),
            new UpgradeDef(UpgradeId.Shockwave,     "Shockwave",      "First hit releases a blast.",                       3, new Color(0.2f, 0.8f, 0.85f)),
            new UpgradeDef(UpgradeId.MagnetBall,    "Magnet Ball",    "Ball steers toward standing pins.",                 3, new Color(0.6f, 0.4f, 0.95f)),
            new UpgradeDef(UpgradeId.Combo,         "Combo",          "Strikes in a row: +50% points each.",               3, new Color(1f, 0.3f, 0.55f)),
            new UpgradeDef(UpgradeId.ExtraHeart,    "Extra Heart",    "+1 heart.",                                         5, new Color(0.85f, 0.2f, 0.25f)),
        };

        public static List<UpgradeDef> RollChoices(RunState run, int count)
        {
            var pool = new List<UpgradeDef>();
            foreach (var u in All)
                if (run.Level(u.id) < u.maxLevel) pool.Add(u);
            for (int i = pool.Count - 1; i > 0; i--)
            {
                int j = Random.Range(0, i + 1);
                var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
            }
            if (pool.Count > count) pool.RemoveRange(count, pool.Count - count);
            return pool;
        }

        public static UpgradeDef Get(UpgradeId id)
        {
            foreach (var u in All) if (u.id == id) return u;
            return null;
        }
    }
}
