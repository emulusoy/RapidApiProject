namespace RapidApiProject.Models.ViewModels.Plan
{
    public class GoalVM
    {
        public int Id { get; set; }
        public string Title { get; set; } = "";
        public string Scope { get; set; } = "month"; // month|year
        public bool Completed { get; set; }
    }
}
