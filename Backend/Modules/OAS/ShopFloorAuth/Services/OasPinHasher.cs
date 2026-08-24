using System.Security.Cryptography;

namespace MyApi.Modules.OAS.ShopFloorAuth.Services;

/// <summary>
/// PBKDF2-based hashing for shop-floor PINs (spec §8.1). Replaces the
/// previous plaintext storage/comparison (user.Pin was compared with a
/// plain `!=`, and set directly on RegeneratePinAsync) without adding a
/// NuGet dependency — everything here is .NET's built-in
/// <see cref="Rfc2898DeriveBytes"/>.
///
/// Stored format is a single self-describing string:
///   "{iterations}.{base64 salt}.{base64 hash}"
/// so the work factor can be raised later without invalidating PINs hashed
/// under a previous iteration count, and so <see cref="LooksLikeHash"/> can
/// tell a hashed value apart from a still-plaintext legacy PIN (4-6 plain
/// digits, no dots) for the lazy migration in OasShopFloorAuthService.
/// </summary>
public static class OasPinHasher
{
    // OWASP 2023 floor for PBKDF2-HMAC-SHA256 is 600k; a 4-digit PIN has only
    // ~13 bits of entropy, so the KDF cost is the ONLY thing standing between a
    // leaked hash and a full offline sweep of all 10k PINs. 210k keeps a badge
    // login well under ~100ms on the API tier while making that sweep ~2x more
    // expensive than before. Existing hashes stay verifiable: the iteration
    // count is stored per-hash in the encoded string, and VerifyAndUpgrade
    // re-hashes stale ones on the next successful login.
    private const int Iterations = 210_000;
    private const int SaltSizeBytes = 16;
    private const int HashSizeBytes = 32;
    private static readonly HashAlgorithmName Algorithm = HashAlgorithmName.SHA256;

    /// <summary>Hashes a plaintext PIN into the self-describing stored format. Call this everywhere a PIN is set (initial creation, regenerate) — never assign a raw PIN to user.Pin.</summary>
    public static string Hash(string pin)
    {
        if (string.IsNullOrEmpty(pin))
        {
            throw new ArgumentException("PIN must not be empty.", nameof(pin));
        }

        var salt = RandomNumberGenerator.GetBytes(SaltSizeBytes);
        var hash = Rfc2898DeriveBytes.Pbkdf2(pin, salt, Iterations, Algorithm, HashSizeBytes);
        return $"{Iterations}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
    }

    /// <summary>
    /// True if <paramref name="stored"/> has this class's "{iterations}.{salt}.{hash}"
    /// shape. A legacy plaintext PIN (short, all-digit, no dots) returns false —
    /// callers use that to fall back to a one-time plaintext comparison and then
    /// upgrade the row to a hash (see OasShopFloorAuthService.LoginByPinAsync).
    /// </summary>
    public static bool LooksLikeHash(string? stored)
    {
        if (string.IsNullOrEmpty(stored)) return false;
        var parts = stored.Split('.');
        return parts.Length == 3
            && int.TryParse(parts[0], out var iterations) && iterations > 0
            && parts[1].Length > 0 && parts[2].Length > 0;
    }

    /// <summary>Verifies a plaintext PIN against a value already in this class's hashed format. Returns false (never throws) for a malformed/foreign stored value.</summary>
    public static bool Verify(string pin, string stored)
    {
        if (string.IsNullOrEmpty(pin) || string.IsNullOrEmpty(stored)) return false;

        var parts = stored.Split('.');
        if (parts.Length != 3) return false;
        if (!int.TryParse(parts[0], out var iterations) || iterations <= 0) return false;

        byte[] salt, expectedHash;
        try
        {
            salt = Convert.FromBase64String(parts[1]);
            expectedHash = Convert.FromBase64String(parts[2]);
        }
        catch (FormatException)
        {
            return false;
        }

        var actualHash = Rfc2898DeriveBytes.Pbkdf2(pin, salt, iterations, Algorithm, expectedHash.Length);
        return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
    }

    /// <summary>
    /// True when a stored hash was produced with fewer iterations than the
    /// current cost. Raising <see cref="Iterations"/> only protects PINs hashed
    /// afterwards, so callers re-hash on the next successful login (the PIN is
    /// only in memory at that moment) — see OasShopFloorAuthService.
    /// </summary>
    public static bool NeedsRehash(string? stored)
    {
        if (!LooksLikeHash(stored)) return true;
        var parts = stored!.Split('.');
        return int.TryParse(parts[0], out var iterations) && iterations < Iterations;
    }
}
