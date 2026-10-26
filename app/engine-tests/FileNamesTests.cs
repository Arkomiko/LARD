namespace MiliPlain.Engine.Tests;

public class FileNamesTests
{
    [Theory]
    [InlineData("Паттерн 1: тест?", "Паттерн 1_ тест_")]
    [InlineData("a/b\\c*d\"e<f>g|h", "a_b_c_d_e_f_g_h")]
    [InlineData("  Трек...  ", "Трек")]
    [InlineData("CON", "_CON")]
    [InlineData("nul", "_nul")]
    [InlineData("", "MiliPlain")]
    [InlineData("???", "___")]
    public void Имя_становится_допустимым_в_Windows(string name, string expected)
    {
        Assert.Equal(expected, FileNames.Safe(name));
    }
}
