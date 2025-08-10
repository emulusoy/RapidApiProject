using Microsoft.AspNetCore.Mvc.Formatters;

namespace RapidApiProject.Models.ViewModels
{
    public class MediaItemVM
    {
        public int Id { get; set; }
        public MediaType Type { get; set; }
        public string Title { get; set; } = "";
        public string? Image { get; set; }
        public string Rating { get; set; }   
        public string? Description { get; set; }
        public bool Watched { get; set; }
    }
}
