/* =========================================================
   33 ШКОЛА — УЧЁТ УЧАЩИХСЯ
   JSON + EXCEL + LOCAL LOGO
========================================================= */

const CLEAR_DB_PASSWORD = "3333";

const STORAGE_KEY =
    "school_students_database_v1";


let db = {

    students: [],

    classes: [],

    teachers: []

};


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadDatabase();

        setupNavigation();

        updateCurrentDate();

        renderAll();

    }
);


/* =========================================================
   DATABASE
========================================================= */

function loadDatabase() {

    try {

        const saved =
            localStorage.getItem(STORAGE_KEY);


        if (saved) {

            const parsed =
                JSON.parse(saved);


            db = {

                students:
                    Array.isArray(parsed.students)
                        ? parsed.students
                        : [],

                classes:
                    Array.isArray(parsed.classes)
                        ? parsed.classes
                        : [],

                teachers:
                    Array.isArray(parsed.teachers)
                        ? parsed.teachers
                        : []

            };

        }

    }
    catch (error) {

        console.error(error);

        db = {

            students: [],

            classes: [],

            teachers: []

        };

    }

}


function saveDatabase() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(db)
    );

}


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    document
        .querySelectorAll(".nav-item")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    showPage(
                        button.dataset.page
                    );

                }
            );

        });

}


function showPage(page) {

    document
        .querySelectorAll(".page")
        .forEach(section => {

            section.classList.remove(
                "active"
            );

        });


    const target =
        document.getElementById(
            `page-${page}`
        );


    if (target) {

        target.classList.add("active");

    }


    document
        .querySelectorAll(".nav-item")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.page === page
            );

        });


    const titles = {

        dashboard:
            "Главная",

        students:
            "Ученики",

        classes:
            "Классы",

        teachers:
            "Преподаватели",

        search:
            "Поиск по ИИН",

        backup:
            "Резервная копия"

    };


    document.getElementById(
        "pageTitle"
    ).textContent =
        titles[page] || "33 школа";

}


/* =========================================================
   RENDER ALL
========================================================= */

function renderAll() {

    updateStatistics();

    renderDashboard();

    renderClasses();

    renderTeachers();

    renderStudents();

    renderClassFilters();

    populateExcelClassSelect();

}


/* =========================================================
   STATISTICS
========================================================= */

function updateStatistics() {

    document.getElementById(
        "statStudents"
    ).textContent =
        db.students.length;


    document.getElementById(
        "statClasses"
    ).textContent =
        db.classes.length;


    document.getElementById(
        "statTeachers"
    ).textContent =
        db.teachers.length;


    const active =
        db.students.filter(
            student =>
                student.status !== "inactive"
        ).length;


    document.getElementById(
        "statActive"
    ).textContent =
        active;

}


/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard() {

    const container =
        document.getElementById(
            "classDistribution"
        );


    if (!db.classes.length) {

        container.innerHTML =
            `<div class="empty">
                Классы пока не добавлены
            </div>`;

    }
    else {

        const total =
            Math.max(
                db.students.length,
                1
            );


        container.innerHTML =
            db.classes.map(cls => {

                const count =
                    db.students.filter(
                        student =>
                            student.classId === cls.id
                    ).length;


                const percent =
                    Math.round(
                        (count / total) * 100
                    );


                return `

                    <div class="class-row">

                        <div class="class-row-head">

                            <span>
                                ${escapeHTML(cls.name)}
                            </span>

                            <strong>
                                ${count}
                            </strong>

                        </div>


                        <div class="progress">

                            <div
                                class="progress-bar"
                                style="width:${percent}%"
                            ></div>

                        </div>

                    </div>

                `;

            }).join("");

    }


    const recent =
        [...db.students]
            .sort(
                (a, b) =>
                    new Date(
                        b.createdAt || 0
                    ) -
                    new Date(
                        a.createdAt || 0
                    )
            )
            .slice(0, 5);


    const recentContainer =
        document.getElementById(
            "recentStudents"
        );


    if (!recent.length) {

        recentContainer.innerHTML =
            `<div class="empty">
                Учащихся пока нет
            </div>`;

        return;

    }


    recentContainer.innerHTML =
        recent.map(student => {

            const cls =
                getClass(
                    student.classId
                );


            return `

                <div
                    class="class-row-head"
                    style="
                        padding:10px 0;
                        border-bottom:
                        1px solid #edf0f4
                    "
                >

                    <div>

                        <strong>
                            ${escapeHTML(student.name)}
                        </strong>

                        <div class="muted">
                            ${escapeHTML(
                                cls?.name ||
                                "Без класса"
                            )}
                        </div>

                    </div>


                    <span>
                        ${escapeHTML(student.iin)}
                    </span>

                </div>

            `;

        }).join("");

}


/* =========================================================
   CLASSES
========================================================= */

function openClassModal(id = null) {

    const cls =
        id
            ? getClass(id)
            : null;


    openModal(

        cls
            ? "Редактировать класс"
            : "Добавить класс",

        `

        <form
            onsubmit="
                saveClass(event, '${id || ""}')
            "
        >

            <div class="form-group">

                <label>
                    Название класса *
                </label>

                <input
                    id="className"
                    required
                    placeholder="Например: 5 А"
                    value="${escapeAttribute(
                        cls?.name || ""
                    )}"
                >

            </div>


            <div class="form-group">

                <label>
                    Классный руководитель
                </label>

                <select id="classTeacher">

                    <option value="">
                        Не назначен
                    </option>

                    ${db.teachers.map(
                        teacher => `

                        <option
                            value="${teacher.id}"
                            ${
                                cls?.teacherId ===
                                teacher.id
                                    ? "selected"
                                    : ""
                            }
                        >
                            ${escapeHTML(
                                teacher.name
                            )}
                        </option>

                    `).join("")}

                </select>

            </div>


            <div class="form-actions">

                <button
                    type="button"
                    class="btn btn-secondary"
                    onclick="closeModal()"
                >
                    Отмена
                </button>


                <button
                    type="submit"
                    class="btn btn-primary"
                >
                    Сохранить
                </button>

            </div>

        </form>

        `
    );

}


function saveClass(event, id) {

    event.preventDefault();


    const name =
        document
            .getElementById("className")
            .value
            .trim();


    const teacherId =
        document
            .getElementById("classTeacher")
            .value;


    if (!name) return;


    const duplicate =
        db.classes.find(
            cls =>
                cls.name.toLowerCase() ===
                name.toLowerCase() &&
                cls.id !== id
        );


    if (duplicate) {

        showToast(
            "Такой класс уже существует"
        );

        return;

    }


    if (id) {

        const cls =
            getClass(id);


        if (cls) {

            cls.name =
                name;

            cls.teacherId =
                teacherId;

        }

    }
    else {

        db.classes.push({

            id:
                generateId(),

            name,

            teacherId

        });

    }


    saveDatabase();

    closeModal();

    renderAll();

    showToast(
        "Класс сохранён"
    );

}


function deleteClass(id) {

    const cls =
        getClass(id);


    if (!cls) return;


    const students =
        db.students.filter(
            student =>
                student.classId === id
        );


    const message =
        students.length

            ? `В классе ${cls.name} есть ${students.length} учащихся. Удалить класс? Учащиеся останутся в базе без класса.`

            : `Удалить класс ${cls.name}?`;


    if (!confirm(message)) {
        return;
    }


    db.students.forEach(
        student => {

            if (
                student.classId === id
            ) {

                student.classId =
                    "";

            }

        }
    );


    db.classes =
        db.classes.filter(
            item =>
                item.id !== id
        );


    saveDatabase();

    renderAll();

    showToast(
        "Класс удалён"
    );

}


function renderClasses() {

    const container =
        document.getElementById(
            "classesGrid"
        );


    if (!db.classes.length) {

        container.innerHTML =
            `<div class="card empty">
                Классы пока не добавлены
            </div>`;

        return;

    }


    container.innerHTML =
        db.classes.map(cls => {

            const teacher =
                getTeacher(
                    cls.teacherId
                );


            const count =
                db.students.filter(
                    student =>
                        student.classId === cls.id
                ).length;


            return `

                <div class="class-card">

                    <div class="class-card-top">

                        <div class="class-name">
                            ${escapeHTML(
                                cls.name
                            )}
                        </div>

                    </div>


                    <div class="class-teacher">

                        Классный руководитель:

                        <strong>
                            ${escapeHTML(
                                teacher?.name ||
                                "не назначен"
                            )}
                        </strong>

                    </div>


                    <div class="class-count">

                        👨‍🎓 Учащихся:
                        <strong>
                            ${count}
                        </strong>

                    </div>


                    <div class="class-actions">

                        <button
                            class="btn btn-secondary"
                            onclick="
                                viewClassStudents(
                                    '${cls.id}'
                                )
                            "
                        >
                            👨‍🎓 Ученики
                        </button>


                        <button
                            class="btn btn-secondary"
                            onclick="
                                exportClassExcel(
                                    '${cls.id}'
                                )
                            "
                        >
                            📥 Excel
                        </button>


                        <button
                            class="icon-btn"
                            onclick="
                                openClassModal(
                                    '${cls.id}'
                                )
                            "
                            title="Изменить"
                        >
                            ✎
                        </button>


                        <button
                            class="icon-btn danger"
                            onclick="
                                deleteClass(
                                    '${cls.id}'
                                )
                            "
                            title="Удалить"
                        >
                            🗑
                        </button>

                    </div>

                </div>

            `;

        }).join("");

}


function viewClassStudents(classId) {

    showPage("students");


    document.getElementById(
        "studentClassFilter"
    ).value =
        classId;


    renderStudents();

}


/* =========================================================
   TEACHERS
========================================================= */

function openTeacherModal(id = null) {

    const teacher =
        id
            ? getTeacher(id)
            : null;


    openModal(

        teacher
            ? "Редактировать преподавателя"
            : "Добавить преподавателя",

        `

        <form
            onsubmit="
                saveTeacher(
                    event,
                    '${id || ""}'
                )
            "
        >

            <div class="form-group">

                <label>
                    ФИО *
                </label>

                <input
                    id="teacherName"
                    required
                    value="${escapeAttribute(
                        teacher?.name || ""
                    )}"
                    placeholder="Иванова Анна Петровна"
                >

            </div>


            <div class="form-group">

                <label>
                    Предмет
                </label>

                <input
                    id="teacherSubject"
                    value="${escapeAttribute(
                        teacher?.subject || ""
                    )}"
                    placeholder="Математика"
                >

            </div>


            <div class="form-actions">

                <button
                    type="button"
                    class="btn btn-secondary"
                    onclick="closeModal()"
                >
                    Отмена
                </button>


                <button
                    type="submit"
                    class="btn btn-primary"
                >
                    Сохранить
                </button>

            </div>

        </form>

        `
    );

}


function saveTeacher(event, id) {

    event.preventDefault();


    const name =
        document
            .getElementById(
                "teacherName"
            )
            .value
            .trim();


    const subject =
        document
            .getElementById(
                "teacherSubject"
            )
            .value
            .trim();


    if (!name) return;


    if (id) {

        const teacher =
            getTeacher(id);


        if (teacher) {

            teacher.name =
                name;

            teacher.subject =
                subject;

        }

    }
    else {

        db.teachers.push({

            id:
                generateId(),

            name,

            subject

        });

    }


    saveDatabase();

    closeModal();

    renderAll();

    showToast(
        "Преподаватель сохранён"
    );

}


function deleteTeacher(id) {

    const teacher =
        getTeacher(id);


    if (!teacher) return;


    if (
        !confirm(
            `Удалить преподавателя ${teacher.name}?`
        )
    ) {

        return;

    }


    db.classes.forEach(
        cls => {

            if (
                cls.teacherId === id
            ) {

                cls.teacherId =
                    "";

            }

        }
    );


    db.teachers =
        db.teachers.filter(
            item =>
                item.id !== id
        );


    saveDatabase();

    renderAll();

    showToast(
        "Преподаватель удалён"
    );

}


function renderTeachers() {

    const tbody =
        document.getElementById(
            "teachersTable"
        );


    if (!db.teachers.length) {

        tbody.innerHTML = `

            <tr>

                <td colspan="5">

                    <div class="empty">
                        Преподаватели пока
                        не добавлены
                    </div>

                </td>

            </tr>

        `;

        return;

    }


    tbody.innerHTML =
        db.teachers.map(
            (teacher, index) => {

                const classes =
                    db.classes
                        .filter(
                            cls =>
                                cls.teacherId ===
                                teacher.id
                        )
                        .map(
                            cls =>
                                cls.name
                        )
                        .join(", ");


                return `

                    <tr>

                        <td>
                            ${index + 1}
                        </td>


                        <td>

                            <strong>
                                ${escapeHTML(
                                    teacher.name
                                )}
                            </strong>

                        </td>


                        <td>
                            ${escapeHTML(
                                teacher.subject ||
                                "—"
                            )}
                        </td>


                        <td>
                            ${escapeHTML(
                                classes ||
                                "—"
                            )}
                        </td>


                        <td>

                            <div
                                class="table-actions"
                            >

                                <button
                                    class="icon-btn"
                                    onclick="
                                        openTeacherModal(
                                            '${teacher.id}'
                                        )
                                    "
                                >
                                    ✎
                                </button>


                                <button
                                    class="icon-btn danger"
                                    onclick="
                                        deleteTeacher(
                                            '${teacher.id}'
                                        )
                                    "
                                >
                                    🗑
                                </button>

                            </div>

                        </td>

                    </tr>

                `;

            }
        ).join("");

}


/* =========================================================
   STUDENTS
========================================================= */

function openStudentModal(id = null) {

    const student =
        id
            ? db.students.find(
                item =>
                    item.id === id
            )
            : null;


    openModal(

        student
            ? "Редактировать ученика"
            : "Добавить ученика",

        `

        <form
            onsubmit="
                saveStudent(
                    event,
                    '${id || ""}'
                )
            "
        >

            <div class="form-grid">


                <div class="form-group full">

                    <label>
                        ФИО *
                    </label>

                    <input
                        id="studentName"
                        required
                        value="${escapeAttribute(
                            student?.name ||
                            ""
                        )}"
                        placeholder="
                            Иванов Иван Иванович
                        "
                    >

                </div>


                <div class="form-group">

                    <label>
                        ИИН *
                    </label>

                    <input
                        id="studentIIN"
                        required
                        maxlength="12"
                        inputmode="numeric"
                        value="${escapeAttribute(
                            student?.iin ||
                            ""
                        )}"
                        placeholder="
                            123456789012
                        "
                    >

                </div>


                <div class="form-group">

                    <label>
                        Дата рождения
                    </label>

                    <input
                        id="studentBirthDate"
                        type="date"
                        value="${escapeAttribute(
                            student?.birthDate ||
                            ""
                        )}"
                    >

                </div>


                <div class="form-group">

                    <label>
                        Класс
                    </label>

                    <select
                        id="studentClass"
                    >

                        <option value="">
                            Без класса
                        </option>

                        ${db.classes.map(
                            cls => `

                            <option
                                value="${cls.id}"
                                ${
                                    student?.classId ===
                                    cls.id
                                        ? "selected"
                                        : ""
                                }
                            >
                                ${escapeHTML(
                                    cls.name
                                )}
                            </option>

                        `).join("")}

                    </select>

                </div>


                <div class="form-group">

                    <label>
                        Статус
                    </label>

                    <select
                        id="studentStatus"
                    >

                        <option
                            value="active"
                            ${
                                !student ||
                                student.status !==
                                "inactive"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Активен
                        </option>


                        <option
                            value="inactive"
                            ${
                                student?.status ===
                                "inactive"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Неактивен
                        </option>

                    </select>

                </div>


                <div class="form-group full">

                    <label>
                        Примечание
                    </label>

                    <input
                        id="studentNote"
                        value="${escapeAttribute(
                            student?.note ||
                            ""
                        )}"
                        placeholder="
                            Дополнительная информация
                        "
                    >

                </div>

            </div>


            <div class="form-actions">

                <button
                    type="button"
                    class="btn btn-secondary"
                    onclick="closeModal()"
                >
                    Отмена
                </button>


                <button
                    type="submit"
                    class="btn btn-primary"
                >
                    Сохранить
                </button>

            </div>

        </form>

        `
    );

}


function saveStudent(event, id) {

    event.preventDefault();


    const name =
        document
            .getElementById(
                "studentName"
            )
            .value
            .trim();


    const iin =
        document
            .getElementById(
                "studentIIN"
            )
            .value
            .trim();


    const birthDate =
        document
            .getElementById(
                "studentBirthDate"
            )
            .value;


    const classId =
        document
            .getElementById(
                "studentClass"
            )
            .value;


    const status =
        document
            .getElementById(
                "studentStatus"
            )
            .value;


    const note =
        document
            .getElementById(
                "studentNote"
            )
            .value
            .trim();


    if (
        !/^\d{12}$/.test(iin)
    ) {

        showToast(
            "ИИН должен содержать ровно 12 цифр"
        );

        return;

    }


    const duplicate =
        db.students.find(
            student =>
                student.iin === iin &&
                student.id !== id
        );


    if (duplicate) {

        showToast(
            "Ученик с таким ИИН уже существует"
        );

        return;

    }


    if (id) {

        const student =
            db.students.find(
                item =>
                    item.id === id
            );


        if (student) {

            student.name =
                name;

            student.iin =
                iin;

            student.birthDate =
                birthDate;

            student.classId =
                classId;

            student.status =
                status;

            student.note =
                note;

        }

    }
    else {

        db.students.push({

            id:
                generateId(),

            name,

            iin,

            birthDate,

            classId,

            status,

            note,

            createdAt:
                new Date().toISOString()

        });

    }


    saveDatabase();

    closeModal();

    renderAll();

    showToast(
        "Ученик сохранён"
    );

}


function deleteStudent(id) {

    const student =
        db.students.find(
            item =>
                item.id === id
        );


    if (!student) return;


    if (
        !confirm(
            `Удалить ученика ${student.name}?`
        )
    ) {

        return;

    }


    db.students =
        db.students.filter(
            item =>
                item.id !== id
        );


    saveDatabase();

    renderAll();

    showToast(
        "Ученик удалён"
    );

}


function renderStudents() {

    const tbody =
        document.getElementById(
            "studentsTable"
        );


    const classFilter =
        document.getElementById(
            "studentClassFilter"
        ).value;


    const search =
        document
            .getElementById(
                "studentSearch"
            )
            .value
            .trim()
            .toLowerCase();


    let students =
        [...db.students];


    if (classFilter) {

        students =
            students.filter(
                student =>
                    student.classId ===
                    classFilter
            );

    }


    if (search) {

        students =
            students.filter(
                student =>

                    student.name
                        .toLowerCase()
                        .includes(search)

                    ||

                    student.iin
                        .includes(search)
            );

    }


    if (!students.length) {

        tbody.innerHTML = `

            <tr>

                <td colspan="8">

                    <div class="empty">
                        Ученики не найдены
                    </div>

                </td>

            </tr>

        `;

        return;

    }


    tbody.innerHTML =
        students.map(
            (student, index) => {

                const cls =
                    getClass(
                        student.classId
                    );


                const teacher =
                    cls
                        ? getTeacher(
                            cls.teacherId
                        )
                        : null;


                return `

                    <tr>

                        <td>
                            ${index + 1}
                        </td>


                        <td>

                            <strong>
                                ${escapeHTML(
                                    student.name
                                )}
                            </strong>

                        </td>


                        <td>
                            ${escapeHTML(
                                student.iin
                            )}
                        </td>


                        <td>
                            ${formatDate(
                                student.birthDate
                            )}
                        </td>


                        <td>
                            ${escapeHTML(
                                cls?.name ||
                                "—"
                            )}
                        </td>


                        <td>
                            ${escapeHTML(
                                teacher?.name ||
                                "—"
                            )}
                        </td>


                        <td>

                            <span
                                class="badge ${
                                    student.status ===
                                    "inactive"
                                        ? "badge-inactive"
                                        : "badge-active"
                                }"
                            >

                                ${
                                    student.status ===
                                    "inactive"
                                        ? "Неактивен"
                                        : "Активен"
                                }

                            </span>

                        </td>


                        <td>

                            <div
                                class="table-actions"
                            >

                                <button
                                    class="icon-btn"
                                    onclick="
                                        openStudentModal(
                                            '${student.id}'
                                        )
                                    "
                                >
                                    ✎
                                </button>


                                <button
                                    class="
                                        icon-btn
                                        danger
                                    "
                                    onclick="
                                        deleteStudent(
                                            '${student.id}'
                                        )
                                    "
                                >
                                    🗑
                                </button>

                            </div>

                        </td>

                    </tr>

                `;

            }
        ).join("");

}


/* =========================================================
   SELECTS
========================================================= */

function renderClassFilters() {

    const select =
        document.getElementById(
            "studentClassFilter"
        );


    const current =
        select.value;


    select.innerHTML = `

        <option value="">
            Все классы
        </option>

        ${db.classes.map(
            cls => `

            <option value="${cls.id}">
                ${escapeHTML(
                    cls.name
                )}
            </option>

        `).join("")}

    `;


    if (
        [...select.options].some(
            option =>
                option.value === current
        )
    ) {

        select.value =
            current;

    }

}


function populateExcelClassSelect() {

    const select =
        document.getElementById(
            "excelClassSelect"
        );


    if (!select) return;


    const current =
        select.value;


    select.innerHTML = `

        <option value="">
            Все классы
        </option>

        ${db.classes.map(
            cls => `

            <option value="${cls.id}">
                ${escapeHTML(
                    cls.name
                )}
            </option>

        `).join("")}

    `;


    if (
        [...select.options].some(
            option =>
                option.value === current
        )
    ) {

        select.value =
            current;

    }

}


/* =========================================================
   SEARCH BY IIN
========================================================= */

function searchByIIN() {

    const iin =
        document
            .getElementById(
                "iinSearch"
            )
            .value
            .trim();


    const result =
        document.getElementById(
            "searchResult"
        );


    if (
        !/^\d{12}$/.test(iin)
    ) {

        result.innerHTML = `

            <div class="student-result">

                <strong>
                    Введите корректный
                    ИИН из 12 цифр.
                </strong>

            </div>

        `;

        return;

    }


    const student =
        db.students.find(
            item =>
                item.iin === iin
        );


    if (!student) {

        result.innerHTML = `

            <div class="student-result">

                Ученик с ИИН

                <strong>
                    ${escapeHTML(iin)}
                </strong>

                не найден.

            </div>

        `;

        return;

    }


    const cls =
        getClass(
            student.classId
        );


    const teacher =
        cls
            ? getTeacher(
                cls.teacherId
            )
            : null;


    result.innerHTML = `

        <div class="student-result">

            <h3>
                ${escapeHTML(
                    student.name
                )}
            </h3>


            <p>

                <strong>
                    ИИН:
                </strong>

                ${escapeHTML(
                    student.iin
                )}

            </p>


            <p>

                <strong>
                    Дата рождения:
                </strong>

                ${formatDate(
                    student.birthDate
                )}

            </p>


            <p>

                <strong>
                    Класс:
                </strong>

                ${escapeHTML(
                    cls?.name ||
                    "—"
                )}

            </p>


            <p>

                <strong>
                    Классный руководитель:
                </strong>

                ${escapeHTML(
                    teacher?.name ||
                    "—"
                )}

            </p>


            <p>

                <strong>
                    Статус:
                </strong>

                ${
                    student.status ===
                    "inactive"
                        ? "Неактивен"
                        : "Активен"
                }

            </p>


            ${
                student.note
                    ? `

                    <p>

                        <strong>
                            Примечание:
                        </strong>

                        ${escapeHTML(
                            student.note
                        )}

                    </p>

                    `
                    : ""
            }

        </div>

    `;

}


/* =========================================================
   JSON BACKUP
========================================================= */

function exportData() {

    const data =
        JSON.stringify(
            db,
            null,
            2
        );


    const blob =
        new Blob(
            [data],
            {
                type:
                    "application/json;charset=utf-8"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const a =
        document.createElement(
            "a"
        );


    a.href =
        url;


    a.download =
        `33_school_backup_${getDateForFile()}.json`;


    a.click();


    URL.revokeObjectURL(
        url
    );


    showToast(
        "JSON резервная копия скачана"
    );

}


function importData(event) {

    const file =
        event.target.files[0];


    if (!file) return;


    const reader =
        new FileReader();


    reader.onload =
        () => {

            try {

                const imported =
                    JSON.parse(
                        reader.result
                    );


                if (
                    !Array.isArray(
                        imported.students
                    ) ||
                    !Array.isArray(
                        imported.classes
                    ) ||
                    !Array.isArray(
                        imported.teachers
                    )
                ) {

                    throw new Error(
                        "Неверный формат резервной копии"
                    );

                }


                if (
                    !confirm(
                        "Загрузить эту резервную копию? Текущие данные будут заменены."
                    )
                ) {

                    event.target.value =
                        "";

                    return;

                }


                db = {

                    students:
                        imported.students,

                    classes:
                        imported.classes,

                    teachers:
                        imported.teachers

                };


                saveDatabase();

                renderAll();


                showToast(
                    "JSON резервная копия загружена"
                );

            }
            catch (error) {

                alert(
                    "Ошибка загрузки JSON:\n" +
                    error.message
                );

            }


            event.target.value =
                "";

        };


    reader.readAsText(
        file
    );

}


function clearDatabase() {
    const password = prompt(
        "Введите пароль для очистки базы данных:"
    );

    if (password === null) {
        return;
    }

    if (password !== CLEAR_DB_PASSWORD) {
        alert("❌ Неверный пароль. База данных не очищена.");
        return;
    }

    const confirmation = confirm(
        "⚠️ ВНИМАНИЕ!\n\n" +
        "Будут удалены ВСЕ ученики, классы и преподаватели.\n\n" +
        "Это действие нельзя отменить.\n\n" +
        "Продолжить?"
    );

    if (!confirmation) {
        return;
    }

    db = {
        students: [],
        classes: [],
        teachers: []
    };

    saveDatabase();
    renderAll();

    showToast("База данных полностью очищена", "success");
}


/* =========================================================
   EXCEL EXPORT
========================================================= */

function exportStudentsExcel() {

    const classId =
        document
            .getElementById(
                "studentClassFilter"
            )
            .value;


    if (classId) {

        exportClassExcel(
            classId
        );

        return;

    }


    exportExcelForStudents(
        db.students,
        "Все классы"
    );

}


function exportExcelFromBackup() {

    const classId =
        document
            .getElementById(
                "excelClassSelect"
            )
            .value;


    if (!classId) {

        exportExcelForStudents(
            db.students,
            "Все классы"
        );

        return;

    }


    exportClassExcel(
        classId
    );

}


function exportClassExcel(
    classId
) {

    const cls =
        getClass(
            classId
        );


    if (!cls) {

        showToast(
            "Класс не найден"
        );

        return;

    }


    const students =
        db.students.filter(
            student =>
                student.classId ===
                classId
        );


    exportExcelForStudents(
        students,
        cls.name
    );

}


function exportExcelForStudents(
    students,
    className
) {

    if (
        typeof XLSX ===
        "undefined"
    ) {

        alert(
            "Библиотека Excel не загружена. Проверьте подключение к интернету."
        );

        return;

    }


    const rows =
        students.map(
            (student, index) => {

                const cls =
                    getClass(
                        student.classId
                    );


                const teacher =
                    cls
                        ? getTeacher(
                            cls.teacherId
                        )
                        : null;


                return {

                    "№":
                        index + 1,

                    "ФИО":
                        student.name ||
                        "",

                    "ИИН":
                        student.iin ||
                        "",

                    "Дата рождения":
                        student.birthDate ||
                        "",

                    "Класс":
                        cls?.name ||
                        "",

                    "Классный руководитель":
                        teacher?.name ||
                        "",

                    "Предмет":
                        teacher?.subject ||
                        "",

                    "Статус":
                        student.status ===
                        "inactive"
                            ? "Неактивен"
                            : "Активен",

                    "Примечание":
                        student.note ||
                        ""

                };

            }
        );


    const worksheet =
        XLSX.utils.json_to_sheet(
            rows
        );


    worksheet["!cols"] = [

        { wch: 6 },
        { wch: 30 },
        { wch: 16 },
        { wch: 16 },
        { wch: 12 },
        { wch: 30 },
        { wch: 20 },
        { wch: 15 },
        { wch: 35 }

    ];


    const workbook =
        XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Ученики"
    );


    const safeName =
        sanitizeFileName(
            className
        );


    XLSX.writeFile(
        workbook,
        `Ученики_${safeName}_${getDateForFile()}.xlsx`
    );


    showToast(
        `Excel скачан: ${className}`
    );

}


/* =========================================================
   EXCEL IMPORT
========================================================= */

function importExcel(event) {

    const file =
        event.target.files[0];


    if (!file) return;


    if (
        typeof XLSX ===
        "undefined"
    ) {

        alert(
            "Библиотека Excel не загружена. Проверьте подключение к интернету."
        );

        event.target.value =
            "";

        return;

    }


    const reader =
        new FileReader();


    reader.onload =
        function(e) {

            try {

                const data =
                    new Uint8Array(
                        e.target.result
                    );


                const workbook =
                    XLSX.read(
                        data,
                        {
                            type: "array"
                        }
                    );


                const sheetName =
                    workbook.SheetNames[0];


                const worksheet =
                    workbook.Sheets[
                        sheetName
                    ];


                const rows =
                    XLSX.utils.sheet_to_json(
                        worksheet,
                        {
                            defval: ""
                        }
                    );


                if (!rows.length) {

                    alert(
                        "Excel-файл не содержит данных."
                    );

                    event.target.value =
                        "";

                    return;

                }


                processExcelRows(
                    rows
                );

            }
            catch (error) {

                console.error(
                    error
                );

                alert(
                    "Ошибка чтения Excel-файла:\n" +
                    error.message
                );

            }


            event.target.value =
                "";

        };


    reader.readAsArrayBuffer(
        file
    );

}


/* =========================================================
   PROCESS EXCEL
========================================================= */

function processExcelRows(
    rows
) {

    let added = 0;

    let updated = 0;

    let skipped = 0;

    const errors = [];


    rows.forEach(
        (row, index) => {

            const excelRow =
                index + 2;


            const name =
                getExcelValue(
                    row,
                    [
                        "ФИО",
                        "ФИО учащегося",
                        "Ученик",
                        "Name"
                    ]
                ).trim();


            let iin =
                getExcelValue(
                    row,
                    [
                        "ИИН",
                        "Иин",
                        "iin",
                        "IIN"
                    ]
                ).trim();


            iin =
                normalizeIIN(
                    iin
                );


            const birthDate =
                getExcelValue(
                    row,
                    [
                        "Дата рождения",
                        "Дата"
                    ]
                ).trim();


            const className =
                getExcelValue(
                    row,
                    [
                        "Класс",
                        "Class"
                    ]
                ).trim();


            const statusRaw =
                getExcelValue(
                    row,
                    [
                        "Статус"
                    ]
                ).trim();


            const note =
                getExcelValue(
                    row,
                    [
                        "Примечание"
                    ]
                ).trim();


            if (!name) {

                skipped++;

                errors.push(
                    `Строка ${excelRow}: отсутствует ФИО`
                );

                return;

            }


            if (
                !/^\d{12}$/.test(iin)
            ) {

                skipped++;

                errors.push(
                    `Строка ${excelRow}: некорректный ИИН "${iin}"`
                );

                return;

            }


            let classId =
                "";


            if (className) {

                let cls =
                    db.classes.find(
                        item =>
                            item.name
                                .toLowerCase() ===
                            className
                                .toLowerCase()
                    );


                if (!cls) {

                    cls = {

                        id:
                            generateId(),

                        name:
                            className,

                        teacherId:
                            ""

                    };


                    db.classes.push(
                        cls
                    );

                }


                classId =
                    cls.id;

            }


            const status =
                normalizeStatus(
                    statusRaw
                );


            const existing =
                db.students.find(
                    student =>
                        student.iin ===
                        iin
                );


            if (existing) {

                existing.name =
                    name;

                existing.birthDate =
                    birthDate;

                existing.classId =
                    classId;

                existing.status =
                    status;

                existing.note =
                    note;

                updated++;

                return;

            }


            db.students.push({

                id:
                    generateId(),

                name,

                iin,

                birthDate,

                classId,

                status,

                note,

                createdAt:
                    new Date()
                        .toISOString()

            });


            added++;

        }
    );


    saveDatabase();

    renderAll();


    let message =
        `Excel обработан.\n\n` +
        `Добавлено: ${added}\n` +
        `Обновлено: ${updated}\n` +
        `Пропущено: ${skipped}`;


    if (errors.length) {

        message +=
            `\n\nОшибки:\n` +
            errors
                .slice(0, 15)
                .join("\n");


        if (
            errors.length > 15
        ) {

            message +=
                `\n...и ещё ${
                    errors.length - 15
                }`;

        }

    }


    alert(
        message
    );


    showToast(
        `Excel: добавлено ${added}, обновлено ${updated}`
    );

}


/* =========================================================
   EXCEL HELPERS
========================================================= */

function getExcelValue(
    row,
    names
) {

    for (
        const name of names
    ) {

        if (
            Object.prototype
                .hasOwnProperty
                .call(
                    row,
                    name
                )
        ) {

            return String(
                row[name] ?? ""
            );

        }

    }


    const keys =
        Object.keys(row);


    for (
        const wanted of names
    ) {

        const normalizedWanted =
            wanted
                .trim()
                .toLowerCase();


        const found =
            keys.find(
                key =>
                    key
                        .trim()
                        .toLowerCase() ===
                    normalizedWanted
            );


        if (found) {

            return String(
                row[found] ?? ""
            );

        }

    }


    return "";

}


function normalizeIIN(
    value
) {

    let text =
        String(
            value || ""
        ).trim();


    if (
        /^\d+\.0$/.test(text)
    ) {

        text =
            text.substring(
                0,
                text.length - 2
            );

    }


    if (
        /^\d+$/.test(text)
    ) {

        text =
            text.padStart(
                12,
                "0"
            );

    }


    return text;

}


function normalizeStatus(
    status
) {

    const value =
        String(
            status || ""
        )
            .trim()
            .toLowerCase();


    if (
        value === "неактивен" ||
        value === "не активен" ||
        value === "inactive"
    ) {

        return "inactive";

    }


    return "active";

}


/* =========================================================
   MODAL
========================================================= */

function openModal(
    title,
    html
) {

    document.getElementById(
        "modalTitle"
    ).textContent =
        title;


    document.getElementById(
        "modalBody"
    ).innerHTML =
        html;


    document.getElementById(
        "modal"
    ).classList.add(
        "show"
    );

}


function closeModal() {

    document.getElementById(
        "modal"
    ).classList.remove(
        "show"
    );

}


document
    .getElementById("modal")
    .addEventListener(
        "click",
        event => {

            if (
                event.target.id ===
                "modal"
            ) {

                closeModal();

            }

        }
    );


/* =========================================================
   HELPERS
========================================================= */

function getClass(id) {

    return db.classes.find(
        cls =>
            cls.id === id
    );

}


function getTeacher(id) {

    return db.teachers.find(
        teacher =>
            teacher.id === id
    );

}


function generateId() {

    return (

        Date.now()
            .toString(36)

        +

        Math.random()
            .toString(36)
            .substring(2, 9)

    );

}


function formatDate(
    date
) {

    if (!date) {
        return "—";
    }


    const parts =
        date.split("-");


    if (
        parts.length === 3
    ) {

        return (
            `${parts[2]}.` +
            `${parts[1]}.` +
            `${parts[0]}`
        );

    }


    return date;

}


function getDateForFile() {

    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            now.getDate()
        ).padStart(
            2,
            "0"
        );


    return (
        `${year}-${month}-${day}`
    );

}


function sanitizeFileName(
    name
) {

    return String(
        name ||
        "Все_классы"
    )
        .replace(
            /[\\/:*?"<>|]/g,
            "_"
        )
        .replace(
            /\s+/g,
            "_"
        );

}


function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


function escapeAttribute(
    value
) {

    return escapeHTML(
        value
    );

}


/* =========================================================
   DATE
========================================================= */

function updateCurrentDate() {

    const element =
        document.getElementById(
            "currentDate"
        );


    const date =
        new Date();


    element.textContent =
        date.toLocaleDateString(
            "ru-RU",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

}


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;


function showToast(
    message
) {

    const toast =
        document.getElementById(
            "toast"
        );


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );

}


/* =========================================================
   SEARCH / FILTER EVENTS
========================================================= */

document.addEventListener(
    "input",
    event => {

        if (
            event.target.id ===
            "studentSearch"
        ) {

            renderStudents();

        }

    }
);


document.addEventListener(
    "change",
    event => {

        if (
            event.target.id ===
            "studentClassFilter"
        ) {

            renderStudents();

        }

    }
);


document.addEventListener(
    "keydown",
    event => {

        if (
            event.target.id ===
            "iinSearch" &&
            event.key ===
            "Enter"
        ) {

            searchByIIN();

        }

    }
);