// Hash mixing function.
const xmur3 = (str) => {
    for (var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353),
            h = h << 13 | h >>> 19;
    return function () {
        h = Math.imul(h ^ h >>> 16, 2246822507),
            h = Math.imul(h ^ h >>> 13, 3266489909);
        return (h ^= h >>> 16) >>> 0;
    }
};

// Mulberry32, a fast high quality PRNG (Pseudo Random Number Generator).
const mb32 = (a) => (t) => (a = a + 1831565813 | 0, t = Math.imul(a ^ a >>> 15, 1 | a), t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t, (t ^ t >>> 14) >>> 0) / 2 ** 32;