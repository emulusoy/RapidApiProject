document.addEventListener('DOMContentLoaded', () => {
    const taskList = document.getElementById('taskList');
    const noteContent = document.getElementById('noteContent');
    const noteTitle = document.getElementById('noteTitle');
    const currentDateSpan = document.getElementById('currentDate');
    const addNewTaskBtn = document.getElementById('addNewTaskBtn');
    const editActiveTaskBtn = document.getElementById('editActiveTaskBtn'); // Yeni düzenle butonu
    const appTitle = document.getElementById('appTitle');
    const editAppTitleBtn = document.getElementById('editAppTitleBtn'); // Uygulama başlığı düzenleme butonu

    // Mevcut tarih
    const today = new Date();
    const formattedDate = today.toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    currentDateSpan.textContent = `TARİH: ${formattedDate}`;

    // Örnek veriler
    let tasks = [
        { id: 1, text: 'Önemli Toplantı Hazırlığı', note: 'Ajanda oluşturuldu, sunum kontrol edildi. Katılımcı listesi güncellendi.', date: '2025-07-28' },
        { id: 2, text: 'Müşteri Arayışları', note: 'Yeni potansiyel müşteriler araştırılacak. İlk temas e-postaları hazırlanacak.', date: '2025-07-29' },
        { id: 3, text: 'Proje Raporunu Tamamla', note: 'Projenin son raporu için tüm veriler toplandı. Grafikler ve analizler eklenecek.', date: '2025-07-30' },
    ];

    let nextTaskId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
    let activeTaskId = tasks.length > 0 ? tasks[0].id : null; // Başlangıçta ilk görevi seçili yap

    // Görev listesini render etme fonksiyonu
    function renderTasks() {
        taskList.innerHTML = ''; // Mevcut listeyi temizle
        tasks.forEach(task => {
            const li = document.createElement('li');
            li.classList.add('task-item');
            if (task.id === activeTaskId) {
                li.classList.add('active');
            }
            li.dataset.id = task.id; // Veri kimliğini ekle

            const taskNumber = document.createElement('span');
            taskNumber.classList.add('task-number');
            taskNumber.textContent = task.id;

            const taskText = document.createElement('span');
            taskText.classList.add('task-text');
            taskText.textContent = task.text;

            li.appendChild(taskNumber);
            li.appendChild(taskText);
            taskList.appendChild(li);
        });
        // İlk görevin notunu yükle (eğer varsa)
        if (activeTaskId) {
            loadNote(activeTaskId);
        } else {
            noteContent.value = '';
            noteTitle.textContent = 'NOT KISMI';
        }
    }

    // Notu yükleme fonksiyonu
    function loadNote(id) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            noteContent.value = task.note;
            noteTitle.textContent = `Not: ${task.text}`; // Not başlığını görev metni yap
            // Tarihi de ilgili görevin tarihi ile güncelleyebiliriz (opsiyonel)
            // currentDateSpan.textContent = `TARİH: ${task.date || formattedDate}`;
        }
    }

    // Görev seçimi event listener'ı (li elementine tıklandığında)
    taskList.addEventListener('click', (event) => {
        const targetItem = event.target.closest('.task-item'); // Tıklanan öğenin en yakın .task-item üst öğesini bul
        if (targetItem) {
            // Notu kaydet (önceki aktif görevin notunu kaydetmek için)
            saveNote(activeTaskId, noteContent.value);

            // Önceki aktif öğeyi pasif yap
            const currentActive = document.querySelector('.task-item.active');
            if (currentActive) {
                currentActive.classList.remove('active');
            }

            // Yeni tıklanan öğeyi aktif yap
            targetItem.classList.add('active');
            activeTaskId = parseInt(targetItem.dataset.id); // Aktif görevin ID'sini güncelle

            // Yeni notu yükle
            loadNote(activeTaskId);
        }
    });

    // Not içeriği değiştiğinde kaydetme fonksiyonu (debounced)
    let saveNoteTimeout;
    noteContent.addEventListener('input', () => {
        clearTimeout(saveNoteTimeout);
        saveNoteTimeout = setTimeout(() => {
            saveNote(activeTaskId, noteContent.value);
            console.log(`Not ID ${activeTaskId} için kaydedildi.`);
        }, 500); // 500ms sonra kaydet
    });

    function saveNote(id, content) {
        // ID null veya undefined ise kaydetme işlemi yapma (ilk yükleme veya henüz seçili görev yoksa)
        if (id === null || id === undefined) return;

        const taskIndex = tasks.findIndex(t => t.id === id);
        if (taskIndex !== -1) {
            tasks[taskIndex].note = content;
        }
    }

    // Yeni görev ekleme butonu
    addNewTaskBtn.addEventListener('click', () => {
        const newTaskText = prompt('Yeni görev başlığını girin:');
        if (newTaskText) {
            const newId = nextTaskId++;
            const newDate = new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' });
            const newTask = { id: newId, text: newTaskText, note: 'Yeni görev notu...', date: newDate };
            tasks.push(newTask);
            renderTasks();

            // Yeni eklenen görevi aktif yap
            const newlyAddedItem = document.querySelector(`.task-item[data-id="${newId}"]`);
            if (newlyAddedItem) {
                // Notu kaydet (eğer bir önceki aktif görev varsa)
                saveNote(activeTaskId, noteContent.value);

                const currentActive = document.querySelector('.task-item.active');
                if (currentActive) {
                    currentActive.classList.remove('active');
                }
                newlyAddedItem.classList.add('active');
                activeTaskId = newId;
                loadNote(activeTaskId); // Not alanını yeni görev için güncelle
            }
            taskList.scrollTop = taskList.scrollHeight; // Listenin sonuna kaydır
        }
    });

    // Aktif görev başlığını düzenleme butonu (yeni eklenen buton)
    editActiveTaskBtn.addEventListener('click', () => {
        if (activeTaskId === null) {
            alert('Lütfen düzenlemek için bir görev seçin.');
            return;
        }
        const task = tasks.find(t => t.id === activeTaskId);
        if (task) {
            const newText = prompt('Aktif görevin başlığını düzenle:', task.text);
            if (newText !== null && newText.trim() !== '') {
                task.text = newText.trim();
                renderTasks(); // Listeyi yeniden çiz
                noteTitle.textContent = `Not: ${task.text}`; // Not başlığını da güncelle
            }
        }
    });

    // Uygulama Başlığı Düzenleme butonu
    editAppTitleBtn.addEventListener('click', () => {
        const currentTitle = appTitle.textContent;
        const newTitle = prompt('Uygulama başlığını düzenle:', currentTitle);
        if (newTitle !== null && newTitle.trim() !== '') {
            appTitle.textContent = newTitle.trim();
        }
    });

    // Sayfa yüklendiğinde görevleri render et
    renderTasks();
});