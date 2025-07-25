using RapidApiProject.Context; // Bu satýrý eklediðinizden emin olun

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

// --- VERÝTABANI BAÐLANTI AYARI BURADAN KALDIRILDI ---
// Sadece ListContext'i baðýmlýlýk enjeksiyonuna ekleyin, yapýlandýrmayý deðil.
builder.Services.AddScoped<ListContext>(); // AddDbContext yerine AddScoped kullanýn
// --- BURAYA KADAR DEÐÝÞTÝRÝLDÝ ---

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Default}/{action=Dashboard}/{id?}");

app.Run();