package edu.kh.project.performance.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.SessionAttribute;

import edu.kh.project.member.model.dto.Member;
import edu.kh.project.perfmgr.model.dto.PerfMgr;
import edu.kh.project.performance.model.dto.Performance;
import edu.kh.project.performance.model.dto.Review;
import edu.kh.project.performance.model.dto.ScheduleInfo;
import edu.kh.project.performance.service.PerformanceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Controller
@RequestMapping("performance")
@RequiredArgsConstructor
@Slf4j
public class PerformanceController {

	private final PerformanceService performanceService;

	/**
	 * 공연 목록 페이지로 이동
	 * 
	 * @param genre 공연 장르
	 * @param model
	 * @return
	 * @author 우수민
	 */
	@GetMapping("/genre/{genre}")
	public String genre(@PathVariable("genre") String genre, Model model) {
		// 장르명 변환 로직
		if (genre.equals("musical")) {
			genre = "뮤지컬";
		}
		if (genre.equals("theater")) {
			genre = "연극";
		}
		if (genre.equals("classic")) {
			genre = "서양음악(클래식)";
		}

		// 첫 페이지 데이터만 가져오기 (20개)
		List<Performance> performances = performanceService.getPerformancesByPage(1, 20, genre);

		log.debug("Performances: {}", performances);

		// 모델에 데이터 추가
		model.addAttribute("performances", performances);
		model.addAttribute("genre", genre);

		return "performance/genre";
	}

	/**
	 * 공연 상세페이지 조회
	 * 
	 * @param mt20id
	 * @param model
	 * @return
	 * @author 우수민
	 */
	@GetMapping("/detail/{mt20id}")
	public String detail(@PathVariable("mt20id") String mt20id, Model model) {

		// 공연 ID로 공연 정보 조회
		Performance performance = performanceService.getPerformanceById(mt20id);

		// 스케줄 및 잔여석 정보 조회
		Map<String, List<ScheduleInfo>> schedule = performanceService.getScheduleWithAvailableSeats(mt20id);
		performance.setSchedule(schedule);

		// 공연 정보 추가
		model.addAttribute("performance", performance);

		return "performance/performance-detail-calander";
	}


	/**
	 * 리뷰 등록
	 * 
	 * @param mt20id
	 * @param reviewStar
	 * @param reviewContent
	 * @return
	 * @author 우수민
	 */
	@PostMapping("/review/insert")
	@ResponseBody
	public Map<String, Object> insertReview(@SessionAttribute("loginMember") Member loginMember,
	                           @RequestBody Review review) {
		
		Map<String, Object> response = new HashMap<>();
		
	    try {
	        // 로그인한 회원의 번호를 DTO에 설정
	        review.setMemberNo(loginMember.getMemberNo());
	        
	        // 리뷰 중복 여부 확인
	        boolean hasReview = performanceService.hasReviewForPerformance(
	                loginMember.getMemberNo(), review.getMt20id());

	        if (hasReview) {
	            response.put("success", false);
	            response.put("message", "이미 등록한 리뷰가 있습니다.");
	            return response; 
	        }

	        // 서비스 호출
	        boolean isInserted = performanceService.insertReview(review);

	        if(isInserted) {
                response.put("success", true);
                response.put("message", "리뷰가 등록되었습니다.");
            } else {
                response.put("success", false);
                response.put("message", "리뷰 등록에 실패했습니다.");
            }
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "리뷰 등록 중 오류가 발생했습니다.");
        }
        
        return response;
	}

	/** 리뷰 수정
	 * @param reviewNo
	 * @param reviewContent
	 * @return
	 * @author 우수민
	 */
	@PostMapping("/review/update")
	@ResponseBody
	public  Map<String, Object> updateReview(@RequestBody Review review) {
		
		Map<String, Object> response = new HashMap<>();

	    try {
	    	
            boolean isUpdated = performanceService.updateReview(review);
            
	        if(isUpdated) {
                response.put("success", true);
                response.put("message", "리뷰가 수정되었습니다.");
            } else {
                response.put("success", false);
                response.put("message", "리뷰 수정에 실패했습니다.");
            }
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "서버 오류가 발생했습니다.");
        }
        
        return response;
	}
	
	/** 리뷰 삭제
	 * @param reviewNo
	 * @return
	 * @author 우수민
	 */
	@PostMapping("/review/delete/{reviewNo}")
	@ResponseBody
	public Map<String, Object> deleteReview(@PathVariable("reviewNo") int reviewNo, @SessionAttribute("loginMember") Member loginMember) {
	    Map<String, Object> response = new HashMap<>();

	    try {
	        // reviewNo와 memberNo를 Map으로 묶어서 전달
	        Map<String, Object> paramMap = new HashMap<>();
	        paramMap.put("reviewNo", reviewNo);
	        paramMap.put("memberNo", loginMember.getMemberNo());
	        
	        // Map을 사용하여 서비스로 전달
	        boolean isDeleted = performanceService.deleteReview(paramMap);
	        
	        if (isDeleted) {
	            response.put("success", true);
	            response.put("message", "리뷰가 삭제되었습니다.");
	        } else {
	            response.put("success", false);
	            response.put("message", "리뷰 삭제에 실패했습니다.");
	        }
	    } catch (Exception e) {
	        response.put("success", false);
	        response.put("message", "서버 오류가 발생했습니다.");
	    }
	    
	    return response;
	}
	
	
	/** 리뷰 목록 조회 
	 * @param mt20id
	 * @return
	 * @author 우수민
	 */
	@GetMapping("/review/list/{mt20id}")
	@ResponseBody
	public List<Review> getReviewsByPerformanceId(@PathVariable("mt20id") String mt20id) {
	    try {
	        
	        List<Review> reviews = performanceService.getReviewsByPerformanceId(mt20id);
	        return reviews; 
	        
	    } catch (Exception e) { // 예외 처리
	        return new ArrayList<>(); 
	    }
	}
}
