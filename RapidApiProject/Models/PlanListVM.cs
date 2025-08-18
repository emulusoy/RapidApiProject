namespace RapidApiProject.Models
{
    public class PlanListVM
    {
        public List<PlanCardVM> Plans { get; set; } = new();
    }
    public class PlanCardVM
    {
        public int Id { get; set; }
        public string Title { get; set; } = "";
        public string FirstImage { get; set; } = "";
        public int ItemCount { get; set; }
    }
}
