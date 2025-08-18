namespace RapidApiProject.Models
{
    public class PlanBuilderVM
    {
        public string? Title { get; set; }
        public List<PlanBuilderItemVM> Items { get; set; } = new();
    }
}
