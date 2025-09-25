const elForm = document.querySelector('.js-form');
const elInput = elForm.querySelector('.form-input');
const elList = document.querySelector('.list');
const countBox = document.querySelector('.count-box');

function createEl(tag, className, text, attrs = {}, id) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    if (id) el.id = id
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    return el;
}

function countNumberAnimate(element, start, end, duration) {
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentValue = Math.floor(start + (end - start) * progress);
        element.textContent = currentValue;

        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

let allTodos = [];

function updateCounters() {
    let doneCount = 0;
    let notDoneCount = 0;

    allTodos.forEach(todo => {
        todo.completed ? doneCount++ : notDoneCount++;
    });

    const doneEl = document.querySelector('[data-value="done"]');
    const allEl = document.querySelector('[data-value="all"]');
    const notDoneEl = document.querySelector('[data-value="not-done"]');

    countNumberAnimate(doneEl, parseInt(doneEl.textContent) || 0, doneCount, 2000);
    countNumberAnimate(allEl, parseInt(allEl.textContent) || 0, allTodos.length, 2000);
    countNumberAnimate(notDoneEl, parseInt(notDoneEl.textContent) || 0, notDoneCount, 2000);
}

async function fetchData() {
    try {
        const res = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=150');
        allTodos = await res.json();
        render(allTodos);
    } catch (error) {
        console.error("Fetch error:", error);
    }
}

function render(arr) {
    elList.innerHTML = '';
    arr.forEach(todo => {
        const newLi = createEl('li');
        const newH3 = createEl('h3', 'text', todo.title);
        const newDiv = createEl('div', 'list-btn-box');
        const newDotDiv = createEl('div', 'dot');
        const newEdit = createEl('button', 'edit-btn', 'Edit', { 'data-id': todo.id });
        const newDelete = createEl('button', 'delet-btn', 'Delete', { 'data-id': todo.id });

        todo.completed === true ? newDotDiv.style.backgroundColor = '#2fff00' : newDotDiv.style.backgroundColor = '#ff0000';
        todo.completed === true ? newLi.style.outlineColor = '#2fff00' : newLi.style.outlineColor = '#ff0000';

        if (todo.completed) newLi.classList.add('completed');

        newDiv.append(newDotDiv, newEdit, newDelete);
        newLi.append(newH3, newDiv);
        elList.append(newLi);
    });

    updateCounters();
}

elForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = elInput.value.trim();
    if (!title) return;

    try {
        const res = await fetch('https://jsonplaceholder.typicode.com/todos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, completed: false })
        });
        const newTodo = await res.json();
        allTodos.unshift(newTodo);
        render(allTodos);
        elInput.value = '';
    } catch (err) {
        console.error("Create error:", err);
    }
});


elList.addEventListener('click', async (e) => {
    const id = e.target.dataset.id;
    const li = e.target.closest('li');

    if (e.target.classList.contains('delet-btn')) {
        try {
            await fetch(`https://jsonplaceholder.typicode.com/todos/${id}`, { method: 'DELETE' });
            allTodos = allTodos.filter(todo => todo.id != id);
            render(allTodos);
        } catch (err) {
            console.error("Delete error:", err);
        }
        return;
    }

    if (e.target.classList.contains('edit-btn')) {
        const h3 = li.querySelector('h3');
        const oldTitle = h3.textContent;

        const input = createEl('input', 'edit-input', null, { type: 'text', value: oldTitle }, id);
        const saveBtn = createEl('button', 'save-btn', 'Save', { 'data-id': id });

        h3.replaceWith(input);
        e.target.replaceWith(saveBtn);

        saveBtn.addEventListener('click', async () => {
            const newTitle = input.value.trim();
            if (!newTitle) return alert("Title bo'sh bo'lmasligi kerak!");

            try {
                const res = await fetch(`https://jsonplaceholder.typicode.com/todos/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: newTitle, completed: false })
                });

                const updatedTodo = await res.json();
                allTodos = allTodos.map(todo => todo.id == id ? { ...todo, ...updatedTodo } : todo);

                const newH3 = createEl('h3', 'text', newTitle);
                input.replaceWith(newH3);
                const newEditBtn = createEl('button', 'edit-btn', 'Edit', { 'data-id': id });
                saveBtn.replaceWith(newEditBtn);

                updateCounters();
            } catch (err) {
                console.error("Update error:", err);
            }
        });
        return;
    }

    if (li && !e.target.classList.contains('edit-btn') && !e.target.classList.contains('delet-btn')) {
        const todoId = li.querySelector('.edit-btn')?.dataset.id;
        if (!todoId) return;

        const todo = allTodos.find(t => t.id == todoId);
        if (!todo) return;

        const newCompleted = !todo.completed;

        if (todoId && confirm('Do you want to change your job status?')) {
            try {
                const res = await fetch(`https://jsonplaceholder.typicode.com/todos/${todoId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ completed: newCompleted })
                });

                const updatedTodo = await res.json();
                allTodos = allTodos.map(t => t.id == todoId ? { ...t, completed: updatedTodo.completed } : t);

                if (newCompleted) {
                    li.classList.add('completed');
                    li.style.outlineColor = '#2fff00';
                    li.querySelector('.dot').style.backgroundColor = '#2fff00';
                } else {
                    li.classList.remove('completed');
                    li.style.outlineColor = '#ff0000';
                    li.querySelector('.dot').style.backgroundColor = '#ff0000';
                }

                updateCounters();
            } catch (err) {
                console.error("Toggle error:", err);
            }
        }
    }
});


countBox.addEventListener('click', (e) => {
    if (!e.target.classList.contains('count')) return;
    const value = e.target.dataset.value;

    if (value === 'done') {
        render(allTodos.filter(todo => todo.completed));
    }
    if (value === 'all') {
        render(allTodos);
    }
    if (value === 'not-done') {
        render(allTodos.filter(todo => !todo.completed));
    }
});

fetchData();