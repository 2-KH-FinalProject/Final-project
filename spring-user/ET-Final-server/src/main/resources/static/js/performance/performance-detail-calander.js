/**
 * 페이지 전체 초기화
 */
function initialize() {
	initializeTabs();
	initializeKakaoMap();
	initializeReviews();
	initializeWish();
	window.calendarInstance = new Calendar();

	// 스크롤 버튼 이벤트 리스너 등록
	scrollToTopButton.addEventListener('click', scrollToTop);
	window.addEventListener('scroll', throttle(toggleScrollButton, 100), { passive: true });
}

// 스크롤 버튼 관련 코드
const scrollToTopButton = document.getElementById('scrollToTop');

// 스크롤 버튼 표시/숨김 처리
function toggleScrollButton() {
	if (window.scrollY > 300) {
		scrollToTopButton.classList.add('visible');
	} else {
		scrollToTopButton.classList.remove('visible');
	}
}

// 최상단으로 스크롤
function scrollToTop() {
	window.scrollTo({
		top: 0,
		behavior: 'smooth'
	});
}

// 스로틀 함수
function throttle(func, limit) {
	let inThrottle;
	return function(...args) {
		if (!inThrottle) {
			func.apply(this, args);
			inThrottle = true;
			setTimeout(() => inThrottle = false, limit);
		}
	}
}

// 스크롤 이벤트 핸들러
const scrollHandler = throttle(() => {
	if (isLoading || !hasMoreData) return;

	const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
	if (scrollTop + clientHeight >= scrollHeight - 300) {
		loadMorePerformances();
	}
}, 150);

/**
 * 탭 기능 초기화
 */
function initializeTabs() {
	const tabButtons = document.querySelectorAll(".tab-button");
	const tabContents = document.querySelectorAll(".tab-content");

	function switchTab(tabId) {
		// 모든 탭 버튼과 컨텐츠의 active 클래스 제거
		tabButtons.forEach((button) => button.classList.remove("active"));
		tabContents.forEach((content) => content.classList.remove("active"));

		// 선택된 탭 버튼과 컨텐츠에 active 클래스 추가
		const selectedButton = document.querySelector(`[data-tab="${tabId}"]`);
		const selectedContent = document.getElementById(tabId);

		if (selectedButton && selectedContent) {
			selectedButton.classList.add("active");
			selectedContent.classList.add("active");

			// 지도 탭이 선택되었을 때 지도 리사이즈
			if (tabId === "location" && window.kakaoMap) {
				window.kakaoMap.relayout();
				// 지도 중심점 재설정
				const fcltla = document.getElementById("fcltla").value;
				const fcltlo = document.getElementById("fcltlo").value;
				const newCenter = new kakao.maps.LatLng(fcltla, fcltlo);
				window.kakaoMap.setCenter(newCenter);
			}
		}
	}

	// 탭 버튼 클릭 이벤트 리스너
	tabButtons.forEach((button) => {
		button.addEventListener("click", () => {
			const tabId = button.getAttribute("data-tab");
			switchTab(tabId);
		});
	});

	// 초기 탭 설정
	switchTab("info");

	// URL 해시값에 따른 탭 전환
	window.addEventListener("hashchange", handleHashChange);
	handleHashChange(); // 초기 로드 시에도 확인
}

/**
 * URL 해시 변경 처리
 */
function handleHashChange() {
	const hash = window.location.hash.slice(1) || "info";
	const validTabs = ["info", "description", "location", "review"];
	if (validTabs.includes(hash)) {
		const tabButton = document.querySelector(`[data-tab="${hash}"]`);
		if (tabButton) {
			tabButton.click();
		}
	}
}

/**
 * 카카오맵 초기화
 */
function initializeKakaoMap() {
	const mapContainer = document.getElementById("map");
	const fcltla = document.getElementById("fcltla").value;
	const fcltlo = document.getElementById("fcltlo").value;

	const mapOption = {
		center: new kakao.maps.LatLng(fcltla, fcltlo),
		level: 3,
	};

	const map = new kakao.maps.Map(mapContainer, mapOption);
	const marker = new kakao.maps.Marker({
		position: map.getCenter(),
	});
	marker.setMap(map);

	// 전역 변수로 지도 객체 저장
	window.kakaoMap = map;
}

// 잔여 좌석 조회 함수
async function fetchAvailableSeats(performanceId, selectedDate) {
	try {
		const response = await fetch(
			`/performanceApi/remainingSeats/${performanceId}/${selectedDate}`
		);
		if (!response.ok) throw new Error("잔여 좌석 조회 실패");

		const scheduleList = await response.json(); // 리스트로 받음
		return scheduleList; // [{time: "14:00", seats: 50, seatStatus: "available"}, ...]
	} catch (error) {
		console.error("서버 통신 오류:", error);
		return [];
	}
}

/**
 * 공연 예매를 위한 캘린더 클래스
 * 날짜 선택, 시간대 선택, 예매 기능을 제공합니다.
 */
class Calendar {
	/**
	 * 캘린더 클래스의 생성자
	 * 초기 설정 및 이벤트 리스너를 등록합니다.
	 */
	constructor() {
		this.performance = performanceData; // 공연 데이터 저장
		this.startDate = new Date(performanceData.startDate); // 공연 시작일
		this.endDate = new Date(performanceData.endDate); // 공연 종료일

		// 시작 날짜의 월을 초기 날짜로 설정
		this.date = new Date();
		this.selectedDate = null; // 선택된 날짜를 저장할 변수
		this.initElements(); // DOM 요소 초기화
		this.renderCalendar(); // 캘린더 렌더링
		this.addEventListeners(); // 이벤트 리스너 등록
	}

	/**
	 * 필요한 DOM 요소들을 초기화하는 메소드
	 */
	initElements() {
		this.currentMonthElement = document.getElementById("currentMonth"); // 현재 월 표시 요소
		this.daysContainer = document.getElementById("calendar-days"); // 날짜 컨테이너 요소
	}

	/**
	 * 이전/다음 월 버튼에 대한 이벤트 리스너를 등록하는 메소드
	 */
	addEventListeners() {
		// 이전 월 버튼 클릭 이벤트
		document.getElementById("prevMonth").addEventListener("click", () => {
			this.date.setMonth(this.date.getMonth() - 1);
			this.renderCalendar();
		});

		// 다음 월 버튼 클릭 이벤트
		document.getElementById("nextMonth").addEventListener("click", () => {
			this.date.setMonth(this.date.getMonth() + 1);
			this.renderCalendar();
		});
	}

	/**
	 * 날짜를 'YYYY. MM' 형식으로 포맷팅하는 메소드
	 * @param {Date} date - 포맷팅할 날짜
	 * @returns {string} 포맷팅된 날짜 문자열
	 */
	formatDate(date) {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		return `${year}. ${month}`;
	}

	/**
	 * 해당 날짜에 공연이 있고 예약 가능한지 확인하는 메소드
	 * @param {Date} date - 확인할 날짜
	 * @returns {boolean} 예약 가능 여부
	 */
	isDateAvailable(date) {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// 내일 날짜 계산
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		const compareDate = new Date(date);
		compareDate.setHours(0, 0, 0, 0);

		// 내일 이전의 날짜는 선택 불가
		if (compareDate < tomorrow) {
			return false;
		}

		const startDateCompare = new Date(this.startDate);
		startDateCompare.setHours(0, 0, 0, 0);
		const endDateCompare = new Date(this.endDate);
		endDateCompare.setHours(0, 0, 0, 0);

		if (compareDate < startDateCompare || compareDate > endDateCompare) {
			return false;
		}

		if (Object.keys(this.performance.schedule).length === 0) {
			return true;
		}

		const dayMap = {
			1: "월요일",
			2: "화요일",
			3: "수요일",
			4: "목요일",
			5: "금요일",
			6: "토요일",
			7: "일요일", // 0 대신 7로 변경
		};

		const day = compareDate.getDay() || 7; // 일요일(0)을 7로 변환
		const dayName = dayMap[day];
		return this.performance.schedule[dayName] !== undefined;
	}

	/**
	 * 날짜가 공연 기간 내에 있는지 확인하는 메소드
	 * @param {Date} date - 확인할 날짜
	 * @returns {boolean} 기간 내 포함 여부
	 */
	isDateInRange(date) {
		const compareDate = new Date(date).setHours(0, 0, 0, 0);
		const startDate = new Date(this.startDate).setHours(0, 0, 0, 0);
		const endDate = new Date(this.endDate).setHours(0, 0, 0, 0);
		return compareDate >= startDate && compareDate <= endDate;
	}

	/**
	 * 캘린더를 화면에 렌더링하는 메소드
	 * 현재 월의 모든 날짜를 표시하고 각 날짜에 대한 이벤트를 설정합니다.
	 */
	renderCalendar() {
		this.currentMonthElement.textContent = this.formatDate(this.date);

		const firstDay = new Date(this.date.getFullYear(), this.date.getMonth(), 1);
		const lastDay = new Date(
			this.date.getFullYear(),
			this.date.getMonth() + 1,
			0
		);
		const startDay = firstDay.getDay(); // 월의 시작 요일
		const totalDays = lastDay.getDate(); // 월의 총 일수

		this.daysContainer.innerHTML = "";

		// 이전 달의 날짜들을 빈 칸으로 채움
		for (let i = 0; i < startDay; i++) {
			const dayElement = document.createElement("div");
			dayElement.className = "day muted";
			dayElement.textContent = "";
			this.daysContainer.appendChild(dayElement);
		}

		// 현재 달의 날짜들을 생성하고 표시
		for (let day = 1; day <= totalDays; day++) {
			const dayElement = document.createElement("div");
			dayElement.className = "day";
			dayElement.textContent = day;

			const currentDate = new Date(
				this.date.getFullYear(),
				this.date.getMonth(),
				day
			);

			// 날짜가 공연 기간 내에 있는지 확인
			if (this.isDateInRange(currentDate)) {
				if (this.isDateAvailable(currentDate)) {
					// 공연이 있는 날짜는 선택 가능하도록 설정
					dayElement.classList.add("available");
					dayElement.addEventListener("click", () => {
						const prevSelected = this.daysContainer.querySelector(".selected");
						if (prevSelected) {
							prevSelected.classList.remove("selected");
						}
						dayElement.classList.add("selected");
						this.selectedDate = currentDate;
						this.handleDateSelection(currentDate);
					});
				} else {
					// 공연이 없는 날짜는 비활성화
					dayElement.classList.add("disabled");
				}
			} else {
				// 공연 기간 외의 날짜는 비활성화
				dayElement.classList.add("disabled");
			}

			this.daysContainer.appendChild(dayElement);
		}
	}

	/**
	 * 날짜가 선택되었을 때의 처리를 담당하는 메소드
	 * 선택된 날짜의 공연 시간대를 표시합니다.
	 * @param {Date} date - 선택된 날짜
	 */
	async handleDateSelection(date) {
		const dayName = date.toLocaleDateString("ko-KR", { weekday: "long" });
		const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();

		document.getElementById(
			"selected-date"
		).innerText = `선택된 날짜: ${this.formatDisplayDate(date)} (${dayName})`;
		document.getElementById("dayOfWeek").value = dayOfWeek;

		const performanceId = this.performance.id;
		const selectedDate = this.formatDisplayDate(date).replace(/\./g, "-");
		const scheduleList = await fetchAvailableSeats(performanceId, selectedDate);

		const timeSlotsContainer = document.getElementById("time-slots");
		timeSlotsContainer.innerHTML = "";

		if (scheduleList && scheduleList.length > 0) {
			scheduleList.forEach((schedule) => {
				const timeSlot = document.createElement("div");
				timeSlot.className = "time-slot";
				timeSlot.innerHTML = `
	                <div>
	                    <div class="time">${schedule.time}</div>
	                </div>
	                <span class="seat-info">(잔여: ${schedule.seats}석)</span>
	            `;
				timeSlot.onclick = () => this.selectTimeSlot(timeSlot, schedule.time);
				timeSlotsContainer.appendChild(timeSlot);
			});
		} else {
			timeSlotsContainer.innerHTML = "<p>해당 날짜에는 공연이 없습니다.</p>";
		}

		document.getElementById("booking-btn").disabled = true;
		this.selectedDate = date;
		this.dayOfWeek = dayOfWeek;
	}

	/**
	 * 날짜를 'YYYY.MM.DD' 형식으로 포맷팅하는 메소드
	 * @param {Date} date - 포맷팅할 날짜
	 * @returns {string} 포맷팅된 날짜 문자열
	 */
	formatDisplayDate(date) {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return `${year}.${month}.${day}`;
	}

	/**
	 * 시간대가 선택되었을 때의 처리를 담당하는 메소드
	 * @param {HTMLElement} selectedSlot - 선택된 시간대 요소
	 * @param {string} time - 선택된 시간
	 */
	selectTimeSlot(selectedSlot, time) {
		// 모든 시간 슬롯에서 선택 표시 제거
		document.querySelectorAll(".time-slot").forEach((slot) => {
			slot.classList.remove("selected");
		});

		// 선택된 시간대 표시
		selectedSlot.classList.add("selected");

		// 선택된 시간과 회차 정보 저장
		this.selectedTime = time;

		// 예매 버튼 활성화
		document.getElementById("booking-btn").disabled = false;
	}
}

function initializeStarRating(container) {
	const labels = Array.from(container.querySelectorAll('label'));
	const inputs = container.querySelectorAll('input[type="radio"]');
	let selectedRating = 0;

	// 별점 업데이트 함수
	const updateStars = (rating) => {
		labels.forEach((label, index) => {
			// 선택된 별점까지 색칠 (역순으로 계산)
			label.style.color = (labels.length - index) <= rating ? '#ffca28' : '#ddd';
		});
	};

	// 별점 초기화 함수
	const resetStars = () => {
		selectedRating = 0;
		inputs.forEach(input => input.checked = false);
		labels.forEach(label => label.style.color = '#ddd');
	};

	// container에 resetStars 함수 추가
	container.resetStars = resetStars;

	// 별점 선택 이벤트
	inputs.forEach((input) => {
		input.addEventListener("change", () => {
			selectedRating = parseInt(input.value);
			updateStars(selectedRating);
		});
	});

	// 호버 이벤트 (왼쪽에서 오른쪽으로)
	labels.forEach((label, index) => {
		label.addEventListener("mouseenter", () => {
			const hoverRating = labels.length - index;
			labels.forEach((l, i) => {
				l.style.color = (labels.length - i) <= hoverRating ? "#ffca28" : "#ddd";
			});
		});
	});

	// 마우스가 벗어났을 때
	container.addEventListener("mouseleave", () => {
		if (selectedRating > 0) {
			updateStars(selectedRating);
		} else {
			labels.forEach(l => l.style.color = "#ddd");
		}
	});

	return {
		getValue: () => selectedRating,
		updateStars: updateStars
	};
}

// 별점을 문자열로 변환하는 함수
function getStarString(rating) {
	const fullStars = '★'.repeat(Math.floor(rating));
	const emptyStars = '☆'.repeat(5 - Math.floor(rating));
	return `${fullStars}${emptyStars}`;
}

/**
 * 리뷰 관련 기능 초기화
 */
function initializeReviews() {
	const mt20id = performanceData.id;
	const currentMemberNo = document.getElementById("currentMemberNo")?.value;

	// 초기 별점 초기화
	const mainStarRating = document.querySelector(".star-rating");
	if (mainStarRating) {
		initializeStarRating(mainStarRating);
	}

	// 리뷰 작성 폼의 상태 업데이트
	function updateReviewFormStatus() {
		const reviewForm = document.querySelector(".review-form");
		if (!reviewForm) return;

		const textarea = reviewForm.querySelector("#reviewContent");
		const submitButton = reviewForm.querySelector("#submitReview");
		const starRating = reviewForm.querySelector(".star-rating");

		// 공연 상태에 따른 메시지
		let message;
		let isReviewable = false;

		switch (performanceData.prfstate) {
			case "공연중":
				isReviewable = true;
				message = "리뷰를 작성해주세요.";
				break;
			case "공연예정":
				message = "공연 시작 후 리뷰를 작성할 수 있습니다.";
				break;
			case "공연종료":
				message = "종료된 공연은 리뷰를 작성할 수 없습니다.";
				break;
			default:
				message = "현재 리뷰를 작성할 수 없습니다.";
		}

		// 리뷰 폼 상태 업데이트
		textarea.disabled = !isReviewable;
		textarea.placeholder = message;
		submitButton.disabled = !isReviewable;

		if (!isReviewable) {
			starRating.style.pointerEvents = "none";
			starRating.style.opacity = "0.5";
		} else {
			starRating.style.pointerEvents = "auto";
			starRating.style.opacity = "1";
		}
	}

	function loadReviews() {
		$.get(`/performance/review/list/${mt20id}`, function(reviews) {
			const reviewList = $("#reviewList");
			reviewList.empty();

			if (reviews.length === 0) {
				reviewList.html(`
	                    <div class="no-review">
	                        <p>첫 번째 리뷰를 작성해보세요!</p>
	                    </div>
	                `);
				return;
			}

			reviews.forEach((review) => {
				const stars = getStarString(review.reviewStar);
				const reviewHtml = `
			                <div class="review-item">
			                    <div class="review-header">
			                        <div class="reviewer-info">
			                            <span class="reviewer-name">${review.memberNickname}</span>
			                            <span class="review-date">${new Date(review.createDate).toLocaleDateString()}</span>
			                        </div>
			                        <div class="review-stars">
			                            ${stars}
			                            <span class="numeric-rating">(${review.reviewStar})</span>
			                        </div>
			                    </div>
			                    <div class="review-content">
			                        ${review.reviewContent}
			                    </div>
			                    ${Number(review.memberNo) === Number(currentMemberNo)
						? `
			                            <div class="review-actions">
			                                <button class="review-action-btn edit-review" data-review-no="${review.reviewNo}">수정</button>
			                                <button class="review-action-btn delete-review" data-review-no="${review.reviewNo}">삭제</button>
			                            </div>
			                        `
						: ""
					}
			                </div>
			            `;
				reviewList.append(reviewHtml);
			});
		});
	}

	// 리뷰 등록
	$("#submitReview").click(function() {
		if (!currentMemberNo) {
			alert("로그인 후 이용해주세요.");
			return;
		}

		const selectedRating = $('input[name="rating"]:checked').val();
		if (!selectedRating) {
			alert("별점을 선택해주세요.");
			return;
		}

		if (!$("#reviewContent").val().trim()) {
			alert("리뷰 내용을 입력해주세요.");
			return;
		}

		const reviewData = {
			mt20id: mt20id,
			reviewStar: selectedRating,  // 직접 선택된 값 사용
			reviewContent: $("#reviewContent").val(),
		};

		$.ajax({
			url: '/performance/review/insert',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify(reviewData),
			success: function(response) {
				if (response.success) {
					alert('리뷰가 등록되었습니다.');
					location.reload(); // 페이지 새로고침
				} else {
					alert(response.message);
				}
			},
			error: function() {
				alert('리뷰 등록에 실패했습니다.');
			}
		});
	});

	// 리뷰 수정 시 별점 초기화
	$(document).on("click", ".edit-review", function() {
		const reviewNo = $(this).data("review-no");
		const reviewItem = $(this).closest(".review-item");
		const content = reviewItem.find(".review-content").text().trim();
		const currentStars = reviewItem.find(".numeric-rating").text().replace(/[()]/g, '');

		reviewItem.html(`
	        <div class="review-edit-form">
	            <div class="edit-star-rating">
	                <input type="radio" name="edit-rating-${reviewNo}" value="1" id="edit-rate1-${reviewNo}" ${Number(currentStars) === 1 ? "checked" : ""}>
	                <label for="edit-rate1-${reviewNo}">★</label>
	                <input type="radio" name="edit-rating-${reviewNo}" value="2" id="edit-rate2-${reviewNo}" ${Number(currentStars) === 2 ? "checked" : ""}>
	                <label for="edit-rate2-${reviewNo}">★</label>
	                <input type="radio" name="edit-rating-${reviewNo}" value="3" id="edit-rate3-${reviewNo}" ${Number(currentStars) === 3 ? "checked" : ""}>
	                <label for="edit-rate3-${reviewNo}">★</label>
	                <input type="radio" name="edit-rating-${reviewNo}" value="4" id="edit-rate4-${reviewNo}" ${Number(currentStars) === 4 ? "checked" : ""}>
	                <label for="edit-rate4-${reviewNo}">★</label>
	                <input type="radio" name="edit-rating-${reviewNo}" value="5" id="edit-rate5-${reviewNo}" ${Number(currentStars) === 5 ? "checked" : ""}>
	                <label for="edit-rate5-${reviewNo}">★</label>
	            </div>
	            <textarea class="edit-content">${content}</textarea>
	            <div class="edit-actions">
	                <button class="review-action-btn save-edit" data-review-no="${reviewNo}">저장</button>
	                <button class="review-action-btn cancel-edit">취소</button>
	            </div>
	        </div>
	    `);

		// 수정 폼의 별점 초기화
		const editStarRating = reviewItem.find(".edit-star-rating")[0];

		// 별점 업데이트 함수
		const updateEditStars = (rating) => {
			const labels = Array.from(editStarRating.querySelectorAll('label'));
			labels.forEach((label, index) => {
				label.style.color = index < rating ? '#ffca28' : '#ddd';
			});
		};

		// 호버 이벤트 추가
		const labels = editStarRating.querySelectorAll('label');
		labels.forEach((label, index) => {
			label.addEventListener('mouseenter', () => {
				Array.from(labels).forEach((l, i) => {
					l.style.color = i <= index ? '#ffca28' : '#ddd';
				});
			});
		});

		// 마우스 벗어날 때 이벤트
		editStarRating.addEventListener('mouseleave', () => {
			const selectedRating = editStarRating.querySelector('input:checked')?.value;
			if (selectedRating) {
				updateEditStars(Number(selectedRating));
			} else {
				Array.from(labels).forEach(label => label.style.color = '#ddd');
			}
		});

		// 클릭 이벤트 추가
		const inputs = editStarRating.querySelectorAll('input[type="radio"]');
		inputs.forEach(input => {
			input.addEventListener('change', () => {
				updateEditStars(Number(input.value));
			});
		});

		// 초기 별점 설정
		if (currentStars) {
			updateEditStars(Number(currentStars));
		}
	});

	// 리뷰 수정 취소
	$(document).on("click", ".cancel-edit", function() {
		loadReviews();
	});

	// 리뷰 수정 저장
	$(document).on("click", ".save-edit", function() {
		const reviewNo = $(this).data("review-no");
		const reviewItem = $(this).closest(".review-item");
		const newContent = reviewItem.find(".edit-content").val();
		const newRating = reviewItem.find(`input[name="edit-rating-${reviewNo}"]:checked`).val();

		if (!newContent.trim()) {
			alert("리뷰 내용을 입력해주세요.");
			return;
		}

		if (!newRating) {
			alert("별점을 선택해주세요.");
			return;
		}

		$.ajax({
			url: '/performance/review/update',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({
				reviewNo: reviewNo,
				reviewContent: newContent,
				reviewStar: newRating
			}),
			success: function(response) {
				if (response.success) {
					alert('리뷰가 수정되었습니다.');
					location.reload(); // 페이지 새로고침
				} else {
					alert(response.message);
				}
			},
			error: function() {
				alert('리뷰 수정 중 오류가 발생했습니다.');
			}
		});
	});

	// 리뷰 삭제
	$(document).on("click", ".delete-review", function() {
		if (!confirm("리뷰를 삭제하시겠습니까?")) return;

		const reviewNo = $(this).data("review-no");

		$.ajax({
			url: `/performance/review/delete/${reviewNo}`,
			type: 'POST',
			success: function(response) {
				if (response.success) {
					alert('리뷰가 삭제되었습니다.');
					location.reload(); // 페이지 새로고침
				} else {
					alert(response.message);
				}
			},
			error: function() {
				alert('리뷰 삭제 중 오류가 발생했습니다.');
			}
		});
	});
	
	// 페이지 로드시 리뷰 폼 상태 업데이트
    updateReviewFormStatus();

	// 초기 리뷰 로드
	loadReviews();
}

// 정리 (기존 코드에서 수정)
window.addEventListener('unload', () => {
	window.removeEventListener('scroll', scrollHandler);
	window.removeEventListener('scroll', toggleScrollButton);
	scrollToTopButton.removeEventListener('click', scrollToTop);
});

// 기존의 예매 버튼 클릭 이벤트를 수정
document.getElementById("booking-btn").onclick = function() {
	const calendar = window.calendarInstance;

	if (calendar.selectedDate && calendar.selectedTime) {
		// mt20id 값 가져오기
		const mt20id = document.getElementById("mt20id")?.value;
		const selectedDate = calendar
			.formatDisplayDate(calendar.selectedDate)
			.replace(/\./g, "-"); // YYYY-MM-DD로 변환
		const selectedTime = calendar.selectedTime;
		const dayOfWeek = calendar.dayOfWeek; // 0(일)~6(토) 값 사용

		if (!mt20id || !selectedDate || !selectedTime || dayOfWeek === undefined) {
			console.error("필수 파라미터가 누락되었습니다:", {
				mt20id,
				selectedDate,
				selectedTime,
				dayOfWeek,
			});
			alert("필수 정보가 누락되었습니다. 다시 선택해주세요.");
			return;
		}

		const url = `/payment/seat-selection?mt20id=${mt20id}&selectedDate=${selectedDate}&selectedTime=${selectedTime}&dayOfWeek=${dayOfWeek}`;

		const width = 1200; // 창 너비
		const height = 800; // 창 높이
		// 화면 중앙 좌표 계산
		const left = window.innerWidth / 2 - width / 2 + window.screenX;
		const top = window.innerHeight / 2 - height / 2 + window.screenY;

		// URL 확인
		console.log("요청 URL:", url);

		// 새 창 열기
		const newWindow = window.open(
			url, // Spring Controller에서 처리 가능한 URL
			"예매창", // 새 창 이름
			`width=${width}, height=${height}, top=${top}, left=${left}, resizable=yes, scrollbars=yes`
		);
		// 새 창 크기 강제로 고정
		if (newWindow) {
			// 새 창 크기 강제 설정
			newWindow.addEventListener("resize", function() {
				newWindow.resizeTo(width, height);
			});
		} else {
			alert("팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.");
		}

		// Spring Controller 응답 확인
		fetch(url)
			.then((response) => {
				console.log("응답 상태:", response.status);
				if (!response.ok) {
					throw new Error("서버에서 실패 응답을 받았습니다.");
				}
				return response.text(); // HTML 응답 받기
			})
			.then((html) => console.log("서버 응답 HTML:", html))
			.catch((error) => console.error("새 창 요청 실패:", error));
	}
};

// 찜하기 기능 초기화
function initializeWish() {
	const wishBtn = document.getElementById("wishBtn");
	const mt20id = document.getElementById("mt20id").value;

	if (!wishBtn) return;

	// 초기 찜 상태 확인
	checkWishStatus();

	wishBtn.addEventListener("click", async function() {

		// 로그인 여부 체크
		const isLoggedIn = document.getElementById("currentMemberNo") !== null;

		if (!isLoggedIn) {
			alert("로그인을 하신 후 서비스 이용이 가능합니다.");
			return;
		}

		try {
			const response = await fetch("/performance/wish", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					mt20id: mt20id,
				}),
			});

			const result = await response.json();

			if (result.success) {
				const wishIcon = document.getElementById("wishIcon");
				const wishText = document.getElementById("wishText");

				if (result.isWished) {
					wishBtn.classList.add("active");
					wishIcon.classList.remove("far");
					wishIcon.classList.add("fas");
					wishText.textContent = "찜취소";
				} else {
					wishBtn.classList.remove("active");
					wishIcon.classList.remove("fas");
					wishIcon.classList.add("far");
					wishText.textContent = "찜하기";
				}
				alert(result.message);
			} else {
				alert(result.message);
			}
		} catch (error) {
			console.error("찜하기 처리 중 오류 발생:", error);
			alert("찜하기 처리 중 오류가 발생했습니다.");
		}
	});
}

// 찜 상태 확인
async function checkWishStatus() {
	const wishBtn = document.getElementById("wishBtn");
	const wishIcon = document.getElementById("wishIcon");
	const wishText = document.getElementById("wishText");
	const mt20id = document.getElementById("mt20id").value;

	try {
		const response = await fetch(`/performance/wish/check/${mt20id}`); // fetch 메서드를 통해 해당 경로로 엔드포인트에 요청을 보냄
		const result = await response.json(); // 백엔드에서 반환된 JSON 데이터

		if (result.isWished) {
			wishBtn.classList.add("active");
			wishIcon.classList.remove("far");
			wishIcon.classList.add("fas");
			wishText.textContent = "찜취소";
		}
	} catch (error) {
		console.error("찜 상태 확인 중 오류 발생:", error);
	}
}

// DOM 로드 완료 시 초기화
window.addEventListener("DOMContentLoaded", initialize);
