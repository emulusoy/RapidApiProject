namespace RapidApiProject.Models
{
    public class ExerciseLibraryVM
    {
        public string? Region { get; set; }   // slug
        public string? Q { get; set; }        // search
        public string? Mechanics { get; set; }
        public string? Equipment { get; set; }
        public string? Difficulty { get; set; }

        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 24;
        public int Total { get; set; }
        public int TotalPages => (int)Math.Ceiling((double)Total / PageSize);

        public IReadOnlyList<(string Slug, string Name, string? Icon, int Count)> Categories { get; set; } = new List<(string, string, string?, int)>();
        public IReadOnlyList<ExerciseItemVM> Items { get; set; } = new List<ExerciseItemVM>();
    }
}
