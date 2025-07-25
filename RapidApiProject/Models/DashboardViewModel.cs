using RapidApiProject.Entities;

namespace RapidApiProject.Models
{
    public class DashboardViewModel
    {
        public int TotalMovies { get; set; }
        public int WatchedMovies { get; set; }
        public int TotalSeries { get; set; }
        public int TotalGames { get; set; }
        public List<Movie> RecentMovies { get; set; } // Assuming you have a Movie class

    }
}
