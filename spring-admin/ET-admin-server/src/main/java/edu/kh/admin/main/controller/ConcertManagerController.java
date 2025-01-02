package edu.kh.admin.main.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.SessionAttributes;

import edu.kh.admin.main.model.dto.Announcement;
import edu.kh.admin.main.model.dto.ConcertManager;
import edu.kh.admin.main.model.dto.Member;
import edu.kh.admin.main.model.dto.Performance;
import edu.kh.admin.main.model.service.ConcertManagerService;
import edu.kh.admin.main.model.service.PerformanceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController 
@CrossOrigin( origins = "http://localhost:3000",
			  allowedHeaders = "*",
			  allowCredentials = "true",
			  methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, 
				           RequestMethod.DELETE, RequestMethod.OPTIONS})
@RequestMapping("manager")
@RequiredArgsConstructor
@Slf4j
@SessionAttributes({ "loginMember" })
public class ConcertManagerController {

	private final ConcertManagerService service;
	
	@GetMapping("managerEnrollList")
	public ResponseEntity<Object> managerEnrollList() {
		List<ConcertManager> managerEnrollList = service.managerEnrollList();
		try {
			return ResponseEntity.status(HttpStatus.OK).body(managerEnrollList);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("회원 목록 조회 중 문제가 발생했음 : " + e.getMessage());
		}
	}
	
	@PostMapping("searchManagerEnrollList")
	public ResponseEntity<Object> searchPerformanceList(@RequestBody Map<String, Object> formdata)  {
				
		List<ConcertManager> searchManagerEnrollList = service.searchManagerEnrollList(formdata);
	
		try {
			return ResponseEntity.status(HttpStatus.OK).body(searchManagerEnrollList);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("회원 목록 조회 중 문제가 발생했음 : " + e.getMessage());
		}
	}
	
	@GetMapping("/{concertManagerNo:[0-9]+}")
	public ResponseEntity<Object> getDetail(@PathVariable("concertManagerNo") int concertManagerNo) {
	    List<ConcertManager> concertManager = service.concertManagerDetail(concertManagerNo);
	    if (concertManager != null) {
	        return ResponseEntity.ok(concertManager);
	    } else {
	        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
	    }
	}
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
//	@GetMapping("showMemberList")
//	public ResponseEntity<Object> showMemberList() {
//		List<Member> showMemberList = service.showMemberList();
//		try {
//			return ResponseEntity.status(HttpStatus.OK).body(showMemberList);
//		} catch (Exception e) {
//			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//					.body("회원 목록 조회 중 문제가 발생했음 : " + e.getMessage());
//		}
//	}
	
}
