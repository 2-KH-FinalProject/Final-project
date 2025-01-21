package edu.kh.admin.main.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
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

import edu.kh.admin.main.model.dto.Inquiry;
import edu.kh.admin.main.model.service.InquiryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController 
@CrossOrigin( origins = "https://final-project-react-individual.vercel.app/",
			  allowedHeaders = "*",
			  allowCredentials = "true",
			  methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, 
				           RequestMethod.DELETE, RequestMethod.OPTIONS})
@RequestMapping("inquiry")
@RequiredArgsConstructor
@Slf4j
@SessionAttributes({ "loginMember" }) 
public class InquiryController {

	@Value("${upload.path}")
	private String uploadDirectory;
	
	private final InquiryService service;
	
	@PostMapping("showInquiryList")
	public ResponseEntity<Object> showInquiryList(@RequestBody Map<String, Object> formData) {
		List<Inquiry> showInquiryList = service.showInquiryList(formData);
		log.info(formData.toString());
		try {
			return ResponseEntity.status(HttpStatus.OK).body(showInquiryList);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("회원 목록 조회 중 문제가 발생했음 : " + e.getMessage());
		}
	}
	
	@PostMapping("searchInquiryList")
	public ResponseEntity<Object> searchInquiryList(@RequestBody Map<String, Object> formData) {
		List<Inquiry> searchInquiryList = service.searchInquiryList(formData);
		log.info(formData.toString());
		try {
			return ResponseEntity.status(HttpStatus.OK).body(searchInquiryList);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("회원 목록 조회 중 문제가 발생했음 : " + e.getMessage());
		}
	}
	
	@GetMapping("/{inquiryNo:[0-9]+}")
	public ResponseEntity<Object> getDetail(@PathVariable("inquiryNo") int inquiryNo) {
	    List<Inquiry> inquiry = service.inquiryDetail(inquiryNo);
	    if (inquiry != null) {
	        return ResponseEntity.ok(inquiry);
	    } else {
	        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
	    }
	}
	
	@PostMapping("reply/{inquiryNo:[0-9]+}")
	public ResponseEntity<Object> reply(@RequestBody Map<String, Object> formData,@PathVariable("inquiryNo") int inquiryNo) {
		formData.put("inquiryNo", inquiryNo);
		
	    int result = service.reply(formData);
	    if (result > 0) {
	        return ResponseEntity.ok(result);
	    } else {
	        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
	    }
	}
	
	@PostMapping("delete/{inquiryNo:[0-9]+}")
	public ResponseEntity<Object> delete(@PathVariable("inquiryNo") int inquiryNo) {
	    int result = service.delete(inquiryNo);
	    if (result > 0) {
	        return ResponseEntity.ok(result);
	    } else {
	        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
	    }
	}
	
//	@PostMapping("delete/{announceNo:[0-9]+}")
//	public ResponseEntity<Object> delete(@PathVariable("announceNo") int announceNo) {
//	    int result = service.delete(announceNo);
//	    if (result > 0) {
//	        return ResponseEntity.ok(result);
//	    } else {
//	        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
//	    }
//	}
//	
//	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
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
