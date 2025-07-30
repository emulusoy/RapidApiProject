// script.js dosyanızda

document.addEventListener('DOMContentLoaded', () => {
    // ... (Mevcut kodunuzun geri kalanı) ...

    const taskList = document.getElementById('taskList');
    const noteContent = document.getElementById('noteContent');
    const noteTitle = document.getElementById('noteTitle');
    const currentDateSpan = document.getElementById('currentDate');
    const addNewTaskBtn = document.getElementById('addNewTaskBtn');
    const editActiveTaskBtn = document.getElementById('editActiveTaskBtn');
    const deleteActiveTaskBtn = document.getElementById('deleteActiveTaskBtn'); // Sil butonu referansı
    const appTitle = document.getElementById('appTitle');
    const editAppTitleBtn = document.getElementById('editAppTitleBtn');

    let tasks = [];
    document.querySelectorAll('.task-item').forEach(item => {
        const id = parseInt(item.dataset.id);
        if (!isNaN(id)) {
            tasks.push({
                id: id,
                text: item.querySelector('.task-text').textContent,
                note: item.querySelector('.note-description-data') ? item.querySelector('.note-description-data').value : '',
                date: item.dataset.date || currentDateSpan.textContent.replace('TARİH: ', '') // Eğer HTML'de date data-attribute varsa onu kullan
            });
        }
    });

    let nextTaskId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
    let activeTaskId = tasks.length > 0 ? tasks[0].id : null;

    if (tasks.length > 0) {
        currentDateSpan.textContent = `TARİH: ${tasks[0].date}`;
        loadNote(activeTaskId);
    } else {
        const today = new Date();
        const formattedDate = today.toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' });
        currentDateSpan.textContent = `TARİH: ${formattedDate}`;
        noteTitle.textContent = 'NOT KISMI';
        noteContent.value = '';
    }

    function renderTasks() {
        const currentTaskItems = taskList.querySelectorAll('.task-item:not(.task-list-buttons-container)');
        currentTaskItems.forEach(item => item.remove());

        let counter = 1;
        tasks.forEach(task => {
            const li = document.createElement('li');
            li.classList.add('task-item');
            if (task.id === activeTaskId) {
                li.classList.add('active');
            }
            li.dataset.id = task.id;
            li.dataset.date = task.date; // Tarihi de data-attribute olarak ekle

            const taskNumber = document.createElement('span');
            taskNumber.classList.add('task-number');
            taskNumber.textContent = counter++;

            const taskText = document.createElement('span');
            taskText.classList.add('task-text');
            taskText.textContent = task.text;

            const hiddenNoteDesc = document.createElement('input');
            hiddenNoteDesc.type = 'hidden';
            hiddenNoteDesc.classList.add('note-description-data');
            hiddenNoteDesc.value = task.note;

            li.appendChild(taskNumber);
            li.appendChild(taskText);
            li.appendChild(hiddenNoteDesc);

            const buttonsContainer = document.querySelector('.task-list-buttons-container');
            if (buttonsContainer) {
                taskList.insertBefore(li, buttonsContainer);
            } else {
                taskList.appendChild(li);
            }
        });

        if (tasks.length === 0) {
            const noTasksLi = document.createElement('li');
            noTasksLi.classList.add('task-item', 'no-tasks');
            const noTasksSpan = document.createElement('span');
            noTasksSpan.classList.add('task-text');
            noTasksSpan.textContent = 'Henüz görev yok.';
            noTasksLi.appendChild(noTasksSpan);
            const buttonsContainer = document.querySelector('.task-list-buttons-container');
            if (buttonsContainer) {
                taskList.insertBefore(noTasksLi, buttonsContainer);
            } else {
                taskList.appendChild(noTasksLi);
            }
        }

        if (activeTaskId) {
            loadNote(activeTaskId);
        } else if (tasks.length > 0) {
            activeTaskId = tasks[0].id;
            document.querySelector(`.task-item[data-id="${activeTaskId}"]`).classList.add('active');
            loadNote(activeTaskId);
        } else {
            noteContent.value = '';
            noteTitle.textContent = 'NOT KISMI';
            const today = new Date();
            const formattedDate = today.toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' });
            currentDateSpan.textContent = `TARİH: ${formattedDate}`;
        }
    }

    function loadNote(id) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            noteContent.value = task.note;
            noteTitle.textContent = `Not: ${task.text}`;
            currentDateSpan.textContent = `TARİH: ${task.date}`;
        } else {
            noteContent.value = '';
            noteTitle.textContent = 'NOT KISMI';
            const today = new Date();
            const formattedDate = today.toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' });
            currentDateSpan.textContent = `TARİH: ${formattedDate}`;
        }
    }

    taskList.addEventListener('click', (event) => {
        const targetItem = event.target.closest('.task-item');
        if (targetItem && !targetItem.classList.contains('no-tasks') && !targetItem.classList.contains('task-list-buttons-container')) {
            saveNote(activeTaskId, noteContent.value);

            const currentActive = document.querySelector('.task-item.active');
            if (currentActive) {
                currentActive.classList.remove('active');
            }

            targetItem.classList.add('active');
            activeTaskId = parseInt(targetItem.dataset.id);

            loadNote(activeTaskId);
        }
    });

    let saveNoteTimeout;
    noteContent.addEventListener('input', () => {
        clearTimeout(saveNoteTimeout);
        saveNoteTimeout = setTimeout(() => {
            saveNote(activeTaskId, noteContent.value);
            // Gerçek projede: Bu noktada sunucuya AJAX ile POST isteği gönderin.
            // fetch('/Dashboard/UpdateNoteContent', {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json'
            //     },
            //     body: JSON.stringify({ noteId: activeTaskId, newContent: noteContent.value })
            // }).then(response => response.json())
            //   .then(data => {
            //       if (data.success) {
            //           console.log('Not içeriği sunucuya kaydedildi.');
            //       } else {
            //           console.error('Not içeriği kaydedilemedi:', data.message);
            //       }
            //   }).catch(error => console.error('Hata:', error));
            console.log(`Not ID ${activeTaskId} için kaydedildi (JS belleğinde).`);
        }, 500);
    });

    function saveNote(id, content) {
        if (id === null || id === undefined) return;
        const taskIndex = tasks.findIndex(t => t.id === id);
        if (taskIndex !== -1) {
            tasks[taskIndex].note = content;
            const taskElement = document.querySelector(`.task-item[data-id="${id}"]`);
            if (taskElement) {
                const hiddenInput = taskElement.querySelector('.note-description-data');
                if (hiddenInput) {
                    hiddenInput.value = content;
                }
            }
        }
    }

    addNewTaskBtn.addEventListener('click', () => {
        const newTaskText = prompt('Yeni görev başlığını girin:');
        if (newTaskText) {
            saveNote(activeTaskId, noteContent.value);

            const newId = nextTaskId++;
            const newDate = new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' });
            const newTask = { id: newId, text: newTaskText.trim(), note: 'Yeni görev notu...', date: newDate };
            tasks.push(newTask);

            // Gerçek projede: Yeni notu sunucuya AJAX ile ekleyin.
            // fetch('/Dashboard/AddNote', {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json'
            //     },
            //     body: JSON.stringify({ title: newTask.text, description: newTask.note, date: newTask.date })
            // }).then(response => response.json())
            //   .then(data => {
            //       if (data.success) {
            //           newTask.id = data.newId; // Sunucudan dönen gerçek ID'yi kullan
            //           renderTasks();
            //           const newlyAddedItem = document.querySelector(`.task-item[data-id="${newId}"]`);
            //           if (newlyAddedItem) {
            //               // ... (aktif yapma ve kaydırma mantığı)
            //           }
            //       } else {
            //           console.error('Not eklenemedi:', data.message);
            //       }
            //   }).catch(error => console.error('Hata:', error));

            renderTasks();

            const newlyAddedItem = document.querySelector(`.task-item[data-id="${newId}"]`);
            if (newlyAddedItem) {
                const currentActive = document.querySelector('.task-item.active');
                if (currentActive) {
                    currentActive.classList.remove('active');
                }
                newlyAddedItem.classList.add('active');
                activeTaskId = newId;
                loadNote(activeTaskId);
            }
            taskList.scrollTop = taskList.scrollHeight;
        }
    });

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
                // Gerçek projede: Sunucuya AJAX ile başlık güncelleme isteği gönderin.
                // fetch('/Dashboard/UpdateNoteTitle', { ... }).then(...)
                renderTasks();
                noteTitle.textContent = `Not: ${task.text}`;
            }
        }
    });

    // SİLME İŞLEMİ İÇİN YENİ FETCH API KULLANIMI
    deleteActiveTaskBtn.addEventListener('click', async () => {
        if (activeTaskId === null) {
            alert('Lütfen silmek için bir görev seçin.');
            return;
        }

        const taskToDelete = tasks.find(t => t.id === activeTaskId);
        if (!taskToDelete) return; // Görev bulunamazsa işlemi durdur

        if (confirm(`"${taskToDelete.text}" başlıklı görevi silmek istediğinizden emin misiniz?`)) {
            try {
                const response = await fetch('/Dashboard/DeleteNote', { // Controller yolu
                    method: 'POST', // POST metodu kullanın
                    headers: {
                        'Content-Type': 'application/json',
                        // Eğer sunucuda [ValidateAntiForgeryToken] kullanılıyorsa, token'ı buraya eklemelisiniz.
                        // 'RequestVerificationToken': document.querySelector('input[name="__RequestVerificationToken"]').value
                    },
                    body: JSON.stringify(activeTaskId) // Sadece ID'yi JSON olarak gönder
                });

                const data = await response.json(); // Sunucudan gelen JSON yanıtını oku

                if (data.success) {
                    console.log('Not başarıyla silindi:', data.message);
                    tasks = tasks.filter(t => t.id !== activeTaskId); // JS dizisinden kaldır

                    // Aktif görevi güncelle: kalan ilk notu aktif yap veya boşsa null yap
                    activeTaskId = tasks.length > 0 ? tasks[0].id : null;
                    renderTasks(); // Listeyi yeniden çiz
                } else {
                    alert('Silme işlemi başarısız oldu: ' + data.message);
                    console.error('Silme başarısız:', data.message);
                }
            } catch (error) {
                console.error('Silme sırasında bir hata oluştu:', error);
                alert('Silme sırasında bir hata oluştu. Lütfen tekrar deneyin.');
            }
        }
    });

    editAppTitleBtn.addEventListener('click', () => {
        const currentTitle = appTitle.textContent;
        const newTitle = prompt('Uygulama başlığını düzenle:', currentTitle);
        if (newTitle !== null && newTitle.trim() !== '') {
            appTitle.textContent = newTitle.trim();
        }
    });

    renderTasks();
});