using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc.Rendering; // SelectListItem için gerekli

namespace RapidApiProject.Models
{
    public class CreateViewModel
    {
        public int ID { get; set; } // Genellikle ID otomatiktir, ama formda varsa alabiliriz
        [Required(ErrorMessage = "Başlık alanı zorunludur.")]
        public string Title { get; set; }

        [Required(ErrorMessage = "Resim URL alanı zorunludur.")]
        [Url(ErrorMessage = "Geçerli bir URL giriniz.")]
        public string Image { get; set; }

        [Required(ErrorMessage = "Puan alanı zorunludur.")]
        [Range(0, 10, ErrorMessage = "Puan 0 ile 10 arasında olmalıdır.")]
        public string Rating { get; set; }

        [Required(ErrorMessage = "Açıklama alanı zorunludur.")]
        [StringLength(500, ErrorMessage = "Açıklama en fazla 500 karakter olabilir.")]
        public string Description { get; set; }

        public bool Watched { get; set; }

        // Dropdown için seçilen türü tutacak özellik
        [Required(ErrorMessage = "Lütfen bir tür seçiniz (Film, Dizi, Oyun).")]
        public string SelectedType { get; set; }

        // Dropdown için seçenekler (Movie, Series, Game)
        public List<SelectListItem> Types { get; set; } = new List<SelectListItem>
        {
            new SelectListItem { Value = "Movie", Text = "Movies" },
            new SelectListItem { Value = "Series", Text = "Series" },
            new SelectListItem { Value = "Game", Text = "Games" }
        };
    }
}