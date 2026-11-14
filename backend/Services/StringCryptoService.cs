using System.Text;

namespace backend.Services;

public static class StringCryptoService
{
    public static string DecryptString(string stringToDencryption)
    {
        Encoding encoding = Encoding.UTF8;
        int numberChars = stringToDencryption.Length;
        var bytes = new byte[numberChars / 2];
        for (int i = 0; i < numberChars; i += 2)
        {
            bytes[i / 2] = Convert.ToByte(stringToDencryption.Substring(i, 2), 16);
        }
        return encoding.GetString(bytes);
    }

    public static string EncryptString(string stringToEncrypt)
    {
        Encoding encoding = Encoding.UTF8;
        var bytes = encoding.GetBytes(stringToEncrypt);
        var sb = new StringBuilder(bytes.Length * 2);
        foreach (var b in bytes)
        {
            sb.Append(b.ToString("x2"));
        }
        return sb.ToString();
    }
}