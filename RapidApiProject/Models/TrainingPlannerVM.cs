namespace RapidApiProject.Models
{
    public class TrainingPlannerVM
    {
        public int ProgramId { get; set; }
        public DateTime WeekStart { get; set; }
        public List<PlannerDayVM> Days { get; set; } = new();
    }
}
