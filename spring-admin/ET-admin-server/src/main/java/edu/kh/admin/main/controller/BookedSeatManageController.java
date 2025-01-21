package edu.kh.admin.main.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.SessionAttributes;

import edu.kh.admin.main.model.dto.BookedSeatManageDTO;
import edu.kh.admin.main.model.dto.ScheduleInfo;
import edu.kh.admin.main.model.dto.Seat;
import edu.kh.admin.main.model.service.BookedSeatManageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 
 */
@RestController
@CrossOrigin(origins = "http://localhost:3000", allowedHeaders = "*", allowCredentials = "true", methods = {
		RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS })
@RequestMapping("seatManage")
@RequiredArgsConstructor
@Slf4j
@SessionAttributes({ "loginMember" })
public class BookedSeatManageController {

	private final BookedSeatManageService service;

	/**
	 * 공연 목록조회
	 * 
	 * @return
	 */
	@GetMapping("/performanceList")
	public ResponseEntity<Object> performanceList() {
		List<BookedSeatManageDTO> performanceList = service.performanceList();

		try {
			return ResponseEntity.status(HttpStatus.OK).body(performanceList);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("공연 목록 조회 중 문제가 발생했습니다 : " + e.getMessage());
		}
	}
	
	/**
	 * 공연 목록 검색
	 * 
	 * @param formData 검색 조건을 담은 폼 데이터
	 * @return 검색된 공연 목록
	 */
	@GetMapping("/searchPerformanceList")
	@ResponseBody
	public ResponseEntity<Object> searchPerformanceList(@RequestParam("selectedValue") String selectedValue,
		    @RequestParam("inputValue") String inputValue) {
	    try {
	    	Map<String, Object> formData = new HashMap<>();
	        formData.put("selectedValue", selectedValue);
	        formData.put("inputValue", inputValue);
	    	
	        // formData에서 검색 조건 추출하여 서비스로 전달
	        List<BookedSeatManageDTO> performanceList = service.searchPerformanceList(formData);
	        return ResponseEntity.status(HttpStatus.OK).body(performanceList);
	    } catch (Exception e) {
	    	e.printStackTrace();
	        return ResponseEntity
	                .status(HttpStatus.INTERNAL_SERVER_ERROR)
	                .body("공연 목록 검색 중 문제가 발생했습니다: " + e.getMessage());
	    }
	}

	/**
	 * 공연 상세정보 조회
	 * 
	 * @param announceNo
	 * @return
	 */
	@GetMapping("/detail/{mt20id}")
	public ResponseEntity<Object> getDetail(@PathVariable("mt20id") String mt20id, Model model) {
		// 공연 ID로 공연 정보 조회
		BookedSeatManageDTO performance = service.getPerformanceById(mt20id);

		// 스케줄 및 잔여석 정보 조회
		Map<String, List<ScheduleInfo>> schedule = service.getScheduleWithAvailableSeats(mt20id);
		performance.setSchedule(schedule);

		try {
			return ResponseEntity.status(HttpStatus.OK).body(performance);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("공연 상세 조회 중 문제가 발생했음 : " + e.getMessage());
		}
	}

	@PostMapping("/bookingSeat")
	public ResponseEntity<Map<String, Object>> getSeats(@RequestBody Map<String, String> requestData) {
		
		String mt20id = requestData.get("mt20id");
		String selectedDate = requestData.get("selectedDate");
		String selectedTime = requestData.get("selectedTime");
		String dayOfWeek = requestData.get("dayOfWeek");

		log.info("좌석 조회 요청: mt20id={}, selectedDate={}, selectedTime={}", mt20id, selectedDate, selectedTime);

		try {
			// 좌석 조회
			List<Seat> seats = service.getSeatsByPerformance(mt20id, selectedDate, selectedTime, dayOfWeek);

			// 이미 예약된 좌석 조회
			List<Seat> bookedSeats = service.getBookedSeats(mt20id, selectedDate, selectedTime);

			// 결과를 Map으로 반환
			Map<String, Object> result = new HashMap<>();
			result.put("seats", seats);
			result.put("bookedSeats", bookedSeats);

			return ResponseEntity.ok(result);

		} catch (Exception e) {
			log.error("좌석 조회 중 오류 발생", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}
	
	@GetMapping("/seats")
	public ResponseEntity<Map<String, Object>> getSeats(
	        @RequestParam("mt20id") String mt20id,
	        @RequestParam("selectedDate") String selectedDate, 
	        @RequestParam("selectedTime") String selectedTime,
	        @RequestParam("dayOfWeek") String dayOfWeek) {
		
		log.info("좌석 조회 요청: mt20id={}, selectedDate={}, selectedTime={}", mt20id, selectedDate, selectedTime);
		
		try {
			// 좌석 조회
			List<Seat> seats = service.getSeatsByPerformance(mt20id, selectedDate, selectedTime, dayOfWeek);
			
			// 이미 예약된 좌석 조회
			List<Seat> bookedSeats = service.getBookedSeats(mt20id, selectedDate, selectedTime);
			
			
			// 결과를 Map으로 반환
			Map<String, Object> result = new HashMap<>();
			result.put("seats", seats);
			result.put("bookedSeats", bookedSeats);
			
			return ResponseEntity.ok(result);
			
		} catch (Exception e) {
			log.error("좌석 조회 중 오류 발생", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}
	
	/** 좌석 이동
	 * @param requestData
	 * @return
	 */
	@PutMapping("/move-seat")
	public ResponseEntity<Object> moveSeat(@RequestBody Map<String, Object> requestData) {
	    String oldSeatId = (String) requestData.get("oldSeatId");
	    String newSeatId = (String) requestData.get("newSeatId");
	    String mt20id = (String) requestData.get("mt20id");
	    String selectedDate = (String) requestData.get("selectedDate");
	    String selectedTime = (String) requestData.get("selectedTime");
	    Integer memberNo = (Integer) requestData.get("memberNo");
	    Integer gradeId = (Integer) requestData.get("gradeId");

	    log.info("좌석 이동 요청: oldSeatId={}, newSeatId={}, mt20id={}, selectedDate={}, selectedTime={}", 
	             oldSeatId, newSeatId, mt20id, selectedDate, selectedTime);

	    try {
	        // 새로운 좌석이 이미 예약되어 있는지 확인
	        boolean isNewSeatBooked = service.isAlreadyBooked(newSeatId, mt20id, selectedDate, selectedTime);
	        if (isNewSeatBooked) {
	            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
	                    .body("이미 예약된 좌석입니다.");
	        }

	        // 좌석 이동 처리
	        boolean result = service.moveSeat(oldSeatId, newSeatId, mt20id, selectedDate, 
	                                        selectedTime, memberNo, gradeId);

	        if (result) {
	            return ResponseEntity.ok().body("좌석 이동이 완료되었습니다.");
	        } else {
	            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
	                    .body("좌석 이동에 실패했습니다.");
	        }
	    } catch (Exception e) {
	        log.error("좌석 이동 중 오류 발생", e);
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
	                .body("좌석 이동 처리 중 오류가 발생했습니다: " + e.getMessage());
	    }
	}

	/** 좌석 상태 변경
	 * @param requestData
	 * @return
	 */
	@PutMapping("/update-seat-status")
	public ResponseEntity<Object> updateSeatStatus(@RequestBody Map<String, Object> requestData) {
	    String seatId = (String) requestData.get("seatId");
	    String mt20id = (String) requestData.get("mt20id");
	    String selectedDate = (String) requestData.get("selectedDate");
	    String selectedTime = (String) requestData.get("selectedTime");
	    String status = (String) requestData.get("status");

	    log.info("좌석 상태 변경 요청: seatId={}, status={}", seatId, status);
	    log.info(requestData.toString());
	    try {
	        if ("BLOCKED".equals(status)) {
	            // 좌석을 비활성화하는 경우 - TB_TICKET_SEAT에 새로운 레코드 추가
	            boolean result = service.insertBlockedSeat(seatId, mt20id, selectedDate, selectedTime);
	            if (result) {
	                return ResponseEntity.ok().body("좌석이 비활성화되었습니다.");
	            }
	        } else if ("AVAILABLE".equals(status)) {
	            // 좌석을 활성화하는 경우 - TB_TICKET_SEAT에서 해당 레코드 삭제
	            boolean result = service.removeBlockedSeat(seatId, mt20id, selectedDate, selectedTime);
	            if (result) {
	                return ResponseEntity.ok().body("좌석이 활성화되었습니다.");
	            }
	        }

	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
	                .body("좌석 상태 변경에 실패했습니다.");
	    } catch (Exception e) {
	        log.error("좌석 상태 변경 중 오류 발생", e);
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
	                .body("좌석 상태 변경 중 오류가 발생했습니다: " + e.getMessage());
	    }
	}

}
