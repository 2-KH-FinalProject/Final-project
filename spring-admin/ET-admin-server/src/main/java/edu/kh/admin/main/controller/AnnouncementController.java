package edu.kh.admin.main.controller;

import java.io.IOException;
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
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.SessionAttributes;
import org.springframework.web.multipart.MultipartFile;

import edu.kh.admin.main.model.dto.Announcement;
import edu.kh.admin.main.model.service.AnnouncementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController 
@CrossOrigin( origins = "http://192.168.50.236/",
			  allowedHeaders = "*",
			  allowCredentials = "true",
			  methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, 
				           RequestMethod.DELETE, RequestMethod.OPTIONS})
@RequestMapping("announcement")
@RequiredArgsConstructor
@Slf4j
@SessionAttributes({ "loginMember" }) 
public class AnnouncementController {

	@Value("${upload.path}")
	private String uploadDirectory;
	
	private final AnnouncementService service;
	
	@GetMapping("showAnnouncementList")
	public ResponseEntity<Object> showAnnouncementList() {
		List<Announcement> showAnnouncementList = service.showAnnouncementList();
		try {
			return ResponseEntity.status(HttpStatus.OK).body(showAnnouncementList);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("회원 목록 조회 중 문제가 발생했음 : " + e.getMessage());
		}
	}
	
	@PostMapping("searchAnnouncementList")
	public ResponseEntity<Object> searchAnnouncementList(@RequestBody Map<String, Object> formdata) {
		List<Announcement> searchAnnouncementList = service.searchAnnouncementList(formdata);
		try {
			return ResponseEntity.status(HttpStatus.OK).body(searchAnnouncementList);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("회원 목록 조회 중 문제가 발생했음 : " + e.getMessage());
		}
	}
	
	
	@GetMapping("/{announceNo:[0-9]+}")
	public ResponseEntity<Object> getDetail(@PathVariable("announceNo") int announceNo) {
	    List<Announcement> announce = service.announcementDetail(announceNo);
	    if (announce != null) {
	        return ResponseEntity.ok(announce);
	    } else {
	        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
	    }
	}
	
	@PostMapping("delete/{announceNo:[0-9]+}")
	public ResponseEntity<Object> delete(@PathVariable("announceNo") int announceNo) {
	    int result = service.delete(announceNo);
	    if (result > 0) {
	        return ResponseEntity.ok(result);
	    } else {
	        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
	    }
	}
	
	
	
	 /** Quill의 내용 저장 메서드
		 * @param file
		 * @return ResponseEntity.ok(uuidFileName);
		 * @throws IllegalStateException
		 * @throws IOException
		 */
		 @PostMapping("upload")
		 public int upload(
				    @RequestPart("title") String title,
				    @RequestPart("content") String content

				)  throws IllegalStateException, IOException {
//				
		        log.info("Received title: {}", title);
		        log.info("content: {}", content);
		        
		        int result = service.upload(title,content);
		        
		        if(result > 0) {
		        	log.info("성공했습니다");
		        }
		        else {
		        	log.info("실패");
		        }
		        
		       return result;

//			 try {
//				 	if(file != null && !file.isEmpty()) {
//				 		// 업로드 된 파일의 이름
//				 		String originalFileName = file.getOriginalFilename();
//				 		
//				 		// 업로드 된 파일의 확장자
//				 		String fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
//				 		
//				 		// 업로드 될 파일의 이름 재설정 (중복 방지를 위해 UUID 사용)
//				 		String uuidFileName = UUID.randomUUID().toString() + fileExtension;
//				 		
//				 		// 위에서 설정한 서버 경로에 이미지 저장
//				 		file.transferTo(new File(uploadDirectory, uuidFileName));
//				 		
////					// Ajax에서 업로드 된 파일의 이름을 응답 받을 수 있도록 해줍니다. 		
//				 	}	
//					
//				} catch (Exception e) {
//					ResponseEntity.badRequest().body("이미지 업로드 실패");
//				}
			}
		
		 
		 @PostMapping("update")
		 public int update(
		         @RequestPart("title") String title,
		         @RequestPart("content") String content,
		         @RequestPart("announceNo") String announceNo,
		         @RequestPart(value = "file", required = false) MultipartFile file) throws IllegalStateException, IOException {

		     log.info("Received title: {}", title);
		     log.info("Content: {}", content);
		     log.info("announceNo: {}", announceNo);

		     // 파일이 있을 경우 처리
		     if (file != null) {
		         String fileName = file.getOriginalFilename();
		         log.info("Received file: {}", fileName);
		     }

		     int result = service.update(title, content, announceNo);

		     if (result > 0) {
		         log.info("Update successful");
		     } else {
		         log.info("Update failed");
		     }

		     return result;
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
