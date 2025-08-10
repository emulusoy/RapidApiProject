namespace RapidApiProject.Models.ViewModels
{
    public class MediaIndexVM
    {
        public IReadOnlyList<MediaItemVM> Items { get; set; } = new List<MediaItemVM>();
        public string Type { get; set; } = "movie";       
        public string Filter { get; set; } = "all";      
        public int CurrentPage { get; set; } = 1;
        public int PageSize { get; set; } = 8;
        public int TotalItems { get; set; } = 0;
        public int TotalPages => (int)Math.Ceiling((double)TotalItems / Math.Max(1, PageSize));


    }
}
