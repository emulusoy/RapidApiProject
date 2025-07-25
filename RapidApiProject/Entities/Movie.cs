namespace RapidApiProject.Entities
{
    public class Movie
    {
        public int ID { get; set; }
        public string Title { get; set; }
        public string Image { get; set; }
        public double Rating { get; set; }
        public string Description { get; set; }
        public bool Watched { get; set; }
    }
}
