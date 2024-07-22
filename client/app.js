let currentPage = 0;
const pageSize = 300; // Установите количество элементов на странице равным 300
let isLoading = false;
let totalResults = 0;

let currentTable = "stat4market";

//Применение фильтров для выгрузки

document.addEventListener("DOMContentLoaded", () => {
	const filterForm = document.getElementById("filterForm");
	filterForm.addEventListener("submit", async function (event) {
		event.preventDefault();
		currentPage = 0; // Сброс страницы при новом фильтре
		const formData = new FormData(filterForm);

		const filterParams = {
			name: formData.get("nameFilter") || null,
			pool: formData.get("poolFilter") || null,
			poolFilterType: formData.get("poolFilterType") || null,
			competitorsCount: formData.get("competitorsFilter") || null,
			competitorsFilterType:
				formData.get("competitorsFilterType") || null,
			growthPercent: formData.get("growthFilter") || null,
			growthFilterType: formData.get("growthFilterType") || null,
		};

		console.log(filterParams.growthPercent);

		fetchData(filterParams, 0, pageSize, "filterFormSubmit"); // Указываем имя функции
	});

	const stat4MarketButton = document.getElementById("loadStat4Market");
	const wbMyTopButton = document.getElementById("loadWbMyTop");

	function setActiveButton(button) {
		document
			.querySelectorAll(".loadData-btn")
			.forEach((btn) => btn.classList.remove("active"));
		button.classList.add("active");
	}

	stat4MarketButton.addEventListener("click", () => {
		currentTable = "stat4market";
		setActiveButton(stat4MarketButton);
		fetchData({}, 0, pageSize);
	});

	wbMyTopButton.addEventListener("click", () => {
		currentTable = "wbmytop";
		setActiveButton(wbMyTopButton);
		fetchData({}, 0, pageSize);
	});

	fetchData({ pool: 200, poolFilterType: "greater" }, 0, pageSize); // Загрузка данных при загрузке страницы с дефолтным фильтром
});

async function fetchData(
	filters,
	skip,
	limit,
	queryFunction,
	order = null,
	column = null
) {
	if (isLoading) return;
	isLoading = true;

	NProgress.start(); // Start the progress bar

	const filter = Object.entries(filters)
		.filter(
			([key, value]) =>
				value !== null && value !== undefined && value !== ""
		)
		.map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
		.join("&");

	try {
		let url = `http://31.172.66.180:8080/data?table=${currentTable}&${filter}&skip=${skip}&limit=${limit}&queryFunction=${queryFunction}`;
		// let url = `http://localhost:8000/data?table=${currentTable}&${filter}&skip=${skip}&limit=${limit}&queryFunction=${queryFunction}`;
		if (order && column) {
			url += `&order=${order}&column=${column}`;
		}

		const response = await fetch(url, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! Status: ${response.status}`);
		}

		if (skip === 0) {
			document.querySelector("#dataTable tbody").innerHTML = ""; // Очистка только в начале
		}

		const result = await response.json();
		renderTable(result.data); // Call renderTable with the fetched data
	} catch (error) {
		console.error("Failed to fetch data:", error);
	} finally {
		NProgress.done();
		isLoading = false;
	}
}

//Узнать количество результатов по применённым фильтрам и по дефолту

document
	.getElementById("updateResultsBtn")
	.addEventListener("click", async function () {
		const filterForm = document.getElementById("filterForm");
		const formData = new FormData(filterForm);

		NProgress.start();

		const filterParams = {
			name: formData.get("nameFilter") || null,
			pool: formData.get("poolFilter") || null,
			poolFilterType: formData.get("poolFilterType") || null,
			competitorsCount: formData.get("competitorsFilter") || null,
			competitorsFilterType:
				formData.get("competitorsFilterType") || null,
			growthPercent: formData.get("growthFilter") || null,
			growthFilterType: formData.get("growthFilterType") || null,
		};

		const filter = Object.entries(filterParams)
			.filter(
				([key, value]) =>
					value !== null && value !== undefined && value !== ""
			)
			.map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
			.join("&");

		try {
			// const response = await fetch(
			// 	`http://localhost:8000/total_count?table=${currentTable}&${filter}&queryFunction=updateResults`
			// );
			const response = await fetch(
				`http://31.172.66.180:8080/total_count?table=${currentTable}&${filter}&queryFunction=updateResults`
			);
			if (response.ok) {
				const totalResults = await response.json();
				document.getElementById(
					"totalResults"
				).innerText = `Всего результатов: ${totalResults}`;
			} else {
				console.error(
					"Ошибка при получении данных:",
					response.statusText
				);
			}
		} catch (error) {
			console.error("Ошибка при выполнении запроса:", error);
		} finally {
			NProgress.done(); // Finish the progress bar
			isLoading = false;
		}
	});

//обработчик скролла
window.addEventListener("scroll", loadMoreData);

//функция для показа полной ячейки наименования запроса
document.getElementById("showHide").addEventListener("click", function () {
	const filterContainer = document.getElementById("filterContainer");
	filterContainer.classList.toggle("formHide");
});

//функция для вызова загрузки csv формат
document
	.getElementById("exportCSVButton")
	.addEventListener("click", function () {
		downloadCSV();
	});

document.addEventListener("DOMContentLoaded", function () {
	fetchLastUpdate("stat4market");
	fetchLastUpdate("wbmytop");
});

async function fetchLastUpdate(table) {
	try {
		// const response = await fetch(
		// 	`http://localhost:8000/last_update?table=${table}`
		// );
		const response = await fetch(
			`http://31.172.66.180:8080/last_update?table=${table}`
		);
		const data = await response.text();
		console.log(data);
		const elementId = `lastUpdate${
			table.charAt(0).toUpperCase() + table.slice(1)
		}`;
		const element = document.getElementById(elementId);
		if (element) {
			element.innerText = data;
		} else {
			console.error(`Element with ID ${elementId} not found`);
		}
	} catch (error) {
		console.error("Error fetching last update:", error);
	}
}

// функция для динамической загрузки выдачи
function loadMoreData() {
	if (isLoading) return;

	if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 2) {
		currentPage++;
		const skip = currentPage * pageSize;
		const filterForm = document.getElementById("filterForm");
		const formData = new FormData(filterForm);
		const filterParams = {
			name: formData.get("nameFilter") || null,
			pool: formData.get("poolFilter") || null,
			poolFilterType: formData.get("poolFilterType") || null,
			competitorsCount: formData.get("competitorsFilter") || null,
			competitorsFilterType:
				formData.get("competitorsFilterType") || null,
			growthPercent: formData.get("growthFilter") || null,
			growthFilterType: formData.get("growthFilterType") || null,
		};

		const headerCell = document.querySelector(
			"th.th-sort-asc, th.th-sort-desc"
		);
		const order = headerCell
			? headerCell.classList.contains("th-sort-asc")
				? "asc"
				: "desc"
			: null;
		const column = headerCell
			? headerCell.getAttribute("data-column")
			: null;

		fetchData(filterParams, skip, pageSize, "loadMoreData", order, column);
	}
}

//загрузка csv
async function downloadCSV() {
	const filterForm = document.getElementById("filterForm");
	const formData = new FormData(filterForm);
	const filterParams = {
		name: formData.get("nameFilter") || null,
		pool: formData.get("poolFilter") || null,
		poolFilterType: formData.get("poolFilterType") || null,
		competitorsCount: formData.get("competitorsFilter") || null,
		competitorsFilterType: formData.get("competitorsFilterType") || null,
		growthPercent: formData.get("growthFilter") || null,
		growthFilterType: formData.get("growthFilterType") || null,
	};

	const filter = Object.entries(filterParams)
		.filter(
			([key, value]) =>
				value !== null && value !== undefined && value !== ""
		)
		.map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
		.join("&");

	console.log(filter);
	NProgress.start(); // Start the progress bar for download

	try {
		// const response = await fetch(
		// 	`http://localhost:8000/export_csv?table=${currentTable}&${filter}&queryFunction=downloadCSV`,
		// 	{
		// 		method: "GET",
		// 		headers: {
		// 			"Content-Type": "text/csv",
		// 		},
		// 	}
		// );
		const response = await fetch(
			`http://31.172.66.180:8080/export_csv?table=${currentTable}&${filter}&queryFunction=downloadCSV`,
			{
				method: "GET",
				headers: {
					"Content-Type": "text/csv",
				},
			}
		);
		if (!response.ok) {
			console.error("Failed to download CSV:", response.statusText);
			return;
		}

		const blob = await response.blob();
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.style.display = "none";
		a.href = url;
		a.download = "export.csv";
		document.body.appendChild(a);
		a.click();
		window.URL.revokeObjectURL(url);
		document.body.removeChild(a);
	} catch (error) {
		console.error("Failed to download CSV:", error);
	} finally {
		NProgress.done(); // Finish the progress bar for download
	}
}

//Сортировка
document.addEventListener("DOMContentLoaded", () => {
	document.querySelectorAll("th").forEach((headerCell) => {
		headerCell.addEventListener("click", () => {
			const tableElement =
				headerCell.parentElement.parentElement.parentElement;
			const headerIndex = Array.prototype.indexOf.call(
				headerCell.parentElement.children,
				headerCell
			);
			const currentIsAscending =
				headerCell.classList.contains("th-sort-asc");

			tableElement
				.querySelectorAll("th")
				.forEach((th) =>
					th.classList.remove("th-sort-asc", "th-sort-desc")
				);
			headerCell.classList.toggle("th-sort-asc", !currentIsAscending);
			headerCell.classList.toggle("th-sort-desc", currentIsAscending);

			const order = currentIsAscending ? "desc" : "asc";
			const column = headerCell.getAttribute("data-column");

			// Получаем текущие фильтры
			const filterForm = document.getElementById("filterForm");
			const formData = new FormData(filterForm);
			const filterParams = {
				name: formData.get("nameFilter") || null,
				pool: formData.get("poolFilter") || null,
				poolFilterType: formData.get("poolFilterType") || null,
				competitorsCount: formData.get("competitorsFilter") || null,
				competitorsFilterType:
					formData.get("competitorsFilterType") || null,
				growthPercent: formData.get("growthFilter") || null,
				growthFilterType: formData.get("growthFilterType") || null,
			};

			fetchData(filterParams, 0, pageSize, "sortData", order, column);
		});
	});
});

function generateWbMyTopLink(name) {
	const baseUrl =
		"https://www.wildberries.ru/catalog/0/search.aspx?xsearch=1&search=";
	const searchQuery = encodeURIComponent(name); // Кодируем имя товара для URL
	return `${baseUrl}${searchQuery}`;
}

function renderTable(data) {
	const tableBody = document.querySelector("#dataTable tbody");

	data.forEach((row) => {
		const tr = document.createElement("tr");

		// Разделяем наименование и ссылку
		const [name, url] = row.name.split("\n");

		// Проверяем, является ли текущая таблица stat4market
		if (currentTable === "stat4market") {
			tr.innerHTML = `
                <td>
                    <div class="table-cell" style="cursor: default;">${name}</div>
                </td>
                <td> </td>
                <td>${row.pool}</td>	
                <td>${row.competitors_count}</td>
                <td>${row.growth_percent}</td>
            `;
			// Добавляем обработчик клика для первой ячейки только для wbmytop
			tr.querySelector(".table-cell").addEventListener("click", () => {
				window.open(url, "_blank"); // Открываем ссылку в новой вкладке
			});
		} else {
			const wbMyTopLink = generateWbMyTopLink(name);

			tr.innerHTML = `
                <td>
                    <div class="table-cell" style="cursor: pointer;">${name}</div>
                </td>
                <td> </td>
                <td>${row.pool}</td>
                <td>${row.competitors_count}</td>
                <td> </td>
            `;

			tr.querySelector(".table-cell").addEventListener("click", () => {
				window.open(wbMyTopLink, "_blank"); // Открываем сгенерированную ссылку
			});
		}
		tableBody.appendChild(tr);
	});
}
