using UnityEngine;

namespace StrikeDungeon
{
    /// <summary>Procedurally generated placeholder sounds, so the prototype ships with zero audio files.</summary>
    public class Sfx : MonoBehaviour
    {
        AudioSource src;
        AudioClip hit, boom, strike, click, roll;
        float lastHit;

        void Awake()
        {
            src = gameObject.AddComponent<AudioSource>();
            src.playOnAwake = false;
            var rnd = new System.Random(7);
            float Noise() => (float)(rnd.NextDouble() * 2.0 - 1.0);

            hit = Make("hit", 0.15f, t => Noise() * Mathf.Exp(-t * 40f) * 0.5f +
                                          Mathf.Sin(2f * Mathf.PI * 230f * t) * Mathf.Exp(-t * 25f) * 0.5f);
            float lp = 0f;
            boom = Make("boom", 0.5f, t => { lp += (Noise() - lp) * 0.08f; return lp * Mathf.Exp(-t * 6f) * 3f; });
            float[] notes = { 523.25f, 659.25f, 783.99f, 1046.5f };
            strike = Make("strike", 0.8f, t =>
            {
                float s = 0f;
                for (int i = 0; i < notes.Length; i++)
                {
                    float st = i * 0.08f;
                    if (t >= st) s += Mathf.Sin(2f * Mathf.PI * notes[i] * t) * Mathf.Exp(-(t - st) * 5f) * 0.25f;
                }
                return s;
            });
            click = Make("click", 0.06f, t => Mathf.Sin(2f * Mathf.PI * 880f * t) * Mathf.Exp(-t * 60f) * 0.6f);
            float lp2 = 0f;
            roll = Make("roll", 0.35f, t => { lp2 += (Noise() - lp2) * 0.05f; return lp2 * Mathf.Sin(Mathf.PI * t / 0.35f) * 1.5f; });
        }

        static AudioClip Make(string name, float dur, System.Func<float, float> f)
        {
            const int sr = 44100;
            int n = Mathf.CeilToInt(sr * dur);
            var data = new float[n];
            for (int i = 0; i < n; i++) data[i] = Mathf.Clamp(f(i / (float)sr), -1f, 1f);
            var clip = AudioClip.Create(name, n, 1, sr, false);
            clip.SetData(data, 0);
            return clip;
        }

        public void Hit(float speed)
        {
            if (Time.unscaledTime - lastHit < 0.03f) return;
            lastHit = Time.unscaledTime;
            src.PlayOneShot(hit, Mathf.Clamp01(speed / 8f) * 0.8f + 0.1f);
        }

        public void Boom() => src.PlayOneShot(boom, 0.8f);
        public void Strike() => src.PlayOneShot(strike, 0.7f);
        public void Click() => src.PlayOneShot(click, 0.6f);
        public void Throw() => src.PlayOneShot(roll, 0.6f);
    }
}
