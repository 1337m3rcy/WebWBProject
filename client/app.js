let currentPage = 0;
const pageSize = 300; // Установите количество элементов на странице равным 300
let isLoading = false;
let totalResults = 0;

document.addEventListener("DOMContentLoaded", () => {
	const filterForm = document.getElementById("filterForm");
	filterForm.addEventListener("submit", async function (event) {
		event.preventDefault();
		currentPage = 0; // Сброс страницы при новом фильтре
		const formData = new FormData(filterForm);

		console.log(growthFilter);

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

	fetchData({ pool: 200, poolFilterType: "greater" }, 0, pageSize); // Загрузка данных при загрузке страницы с дефолтным фильтром
});

async function fetchData(filters, skip, limit, queryFunction) {
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
		const url = `http://31.172.66.180:8080/data?${filter}&skip=${skip}&limit=${limit}&queryFunction=${queryFunction}`;

		console.log(filter);
		const response = await fetch(url, {
			method: "GET", // Явно указываем метод GET
			headers: {
				"Content-Type": "application/json",
			},
		});
		if (!response.ok) {
			throw new Error(`HTTP error! Status: ${response.status}`);
		}
		const result = await response.json();

		const responseCount = await fetch(
			`http://31.172.66.180:8080/total_count?${filter}&queryFunction=${queryFunction}`
		);
		if (!responseCount.ok) {
			throw new Error(`HTTP error! Status: ${responseCount.status}`);
		}
		const totalCount = await responseCount.json();

		const dataTable = document
			.getElementById("dataTable")
			.getElementsByTagName("tbody")[0];
		if (skip === 0) {
			dataTable.innerHTML = ""; // Очищаем таблицу перед добавлением новых данных, если это первая страница
		}

		result.data.forEach((row) => {
			const newRow = dataTable.insertRow();
			const cell1 = newRow.insertCell(0);
			const cell2 = newRow.insertCell(1);
			const cell3 = newRow.insertCell(2);
			const cell4 = newRow.insertCell(3);
			const cell5 = newRow.insertCell(4);
			cell1.innerHTML = `<div class="table-cell">${row.name}</div>`;
			cell2.innerHTML = `<div class="table-cell">${row.categories}</div>`;
			cell3.innerHTML = `<div class="table-cell">${row.pool}</div>`;
			cell4.innerHTML = `<div class="table-cell">${row.competitors_count}</div>`;
			cell5.innerHTML = `<div class="table-cell">${row.growth_percent}</div>`;

			// Добавляем обработчики кликов для каждой ячейки
			newRow.querySelectorAll(".table-cell").forEach((cell) => {
				cell.addEventListener("click", () => {
					cell.classList.toggle("expanded"); // Переключаем класс expanded для ячейки при клике
				});
			});
		});

		totalResults = totalCount;
		document.getElementById(
			"totalResults"
		).innerText = `Всего результатов: ${totalResults}`;
		updateResultsCounter();
	} catch (error) {
		console.error("Failed to fetch data:", error);
	} finally {
		NProgress.done(); // Finish the progress bar
		isLoading = false;
	}
}

function updateResultsCounter() {
	const totalResultsElement = document.getElementById("totalResults");
	totalResultsElement.textContent = `Всего результатов: ${totalResults}`;
}

window.addEventListener("scroll", loadMoreData);

document.getElementById("showHide").addEventListener("click", function () {
	const filterContainer = document.getElementById("filterContainer");
	filterContainer.classList.toggle("formHide");
});

document
	.getElementById("exportCSVButton")
	.addEventListener("click", function () {
		downloadCSV();
	});

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

		fetchData(filterParams, skip, pageSize, "loadMoreData");
	}
}

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
		const response = await fetch(
			`http://31.172.66.180:8080/export_csv?${filter}&queryFunction=downloadCSV`,
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
