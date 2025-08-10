// Models/ViewModels/CreateMediaVM.cs
using System.ComponentModel.DataAnnotations;

public class CreateMediaVM
{
    [Required]
    [RegularExpression("movie|series|game", ErrorMessage = "Type: movie, series veya game olmalı.")]
    public string Type { get; set; } = "movie"; // movie | series | game

    [Required, StringLength(200)]
    public string Title { get; set; } = "";

    [Url, StringLength(500)]
    public string? Image { get; set; }

    // DB'de string olduğu için burada da string tutuyoruz
    [Required, StringLength(3, ErrorMessage = "Rating en fazla 2 harf olmalı. Bir de nokta koyabilirsiniz")]
    public string Rating { get; set; } = "";

    [StringLength(2000)]
    public string? Description { get; set; }

    public bool Watched { get; set; } = false;
}
