package edu.kh.project.performance.controller;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.SessionAttribute;
import org.springframework.web.multipart.MultipartFile;

import edu.kh.project.perfmgr.model.dto.PerfMgr;
import edu.kh.project.performance.model.dto.Performance;
import edu.kh.project.performance.model.dto.PerformanceRegistrationDTO;
import edu.kh.project.performance.model.dto.ScheduleInfo;
import edu.kh.project.performance.service.PerformanceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Controller
@RequestMapping("performanceApi")
@RequiredArgsConstructor
@Slf4j
public class PerformanceApiController {

	@Autowired
	private PerformanceService performanceService;
	
	@Value("${my.performance.location}")
	private String performanceLocation;
	
	@Value("${my.performance.resource-handler}")
	private String resourceHandler;

	/**
	 * 잔여 좌석 개수 조회
	 * 
	 * @param page
	 * @param genre
	 * @return
	 */
	@GetMapping("/remainingSeats/{performanceId}/{selectedDate}")
	@ResponseBody
	public ResponseEntity<List<ScheduleInfo>> remainingSeats(@PathVariable("performanceId") String performanceId,
			@PathVariable("selectedDate") String selectedDate) {
		try {
			Map<String, Object> paramMap = new HashMap<>();

			paramMap.put("performanceId", performanceId);
			paramMap.put("selectedDate", selectedDate);

			// 잔여 좌석 개수 조회
			List<ScheduleInfo> seatsInfo = performanceService.remainingSeats(paramMap);

			return ResponseEntity.ok(seatsInfo);

		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
		}
	}

	/**
	 * 무한 스크롤 데이터
	 * 
	 * @param page
	 * @param genre
	 * @return
	 */
	@GetMapping("/genre/more")
	@ResponseBody
	public List<Performance> getMorePerformances(@RequestParam(value = "page", defaultValue = "1") int page,
			@RequestParam(value = "genre") String genre, 
			@RequestParam(value = "filter") String filter,
			@RequestParam(value = "searchKeyword", required = false) String searchKeyword, // 검색어
			@RequestParam(value = "searchType", required = false) String searchType // 검색 타입
	) {
		int pageSize = 20;
		return performanceService.getPerformancesByPage(page, pageSize, genre, filter, searchKeyword, searchType);
	}

	/**
	 * 공연장 좌석 정보 목록
	 * 
	 * @param
	 * @return
	 * @author 우수민
	 */
	@GetMapping("/venue/seats/{mt10id}")
	@ResponseBody
	public ResponseEntity<List<Map<String, Object>>> loadVenueSeats(@PathVariable("mt10id") String mt10id) {
		try {
			// 공연장 좌석 정보 목록
			List<Map<String, Object>> priceSeatInfo = performanceService.priceSeatInfoList(mt10id);

			return ResponseEntity.ok(priceSeatInfo);

		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
		}
	}

	/**
	 * 공연 일정 중복 체크
	 * 
	 * @param
	 * @return
	 * @author 우수민
	 */
	@GetMapping("/venue/reserved-dates/{mt10id}")
	@ResponseBody
	public ResponseEntity<List<Map<String, Object>>> reservedDates(@PathVariable("mt10id") String mt10id) {
		try {

			// 공연 일정 중복 체크
			List<Map<String, Object>> result = performanceService.reservedDates(mt10id);

			return ResponseEntity.ok(result);

		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
		}
	}

	/**
	 * 공연 등록
	 * 
	 * @param
	 * @return
	 * @author 우수민
	 */
	@PostMapping("/register")
	@ResponseBody
	public ResponseEntity register(@RequestBody PerformanceRegistrationDTO dto, 
	                             @SessionAttribute("loginMember") PerfMgr loginMember) throws Exception {
	    try {
	        // Base64 이미지가 있는 경우 파일로 저장
	        if (dto.getPosterBase64() != null && !dto.getPosterBase64().isEmpty()) {
	            String uploadDir = performanceLocation; // application.properties에서 설정된 경로 사용
	            String filename = saveBase64Image(dto.getPosterBase64(), uploadDir, dto.getPosterFileName());
	            dto.setPosterFileName(filename); // 저장된 파일명 설정
	        }

	        dto.setConcertManagerNo(loginMember.getConcertManagerNo());
	        dto.setEntrpsnm(loginMember.getConcertManagerCompany());

	        // 공연 등록
	        int result = performanceService.registerPerformance(dto);
	        return ResponseEntity.ok(result);

	    } catch (Exception e) {
	        log.error("Performance registration failed", e);
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
	    }
	}


	private String saveBase64Image(String base64Image, String uploadDir, String originalFilename) throws Exception {
	    // Base64 데이터에서 실제 이미지 데이터 추출
	    String[] parts = base64Image.split(",");
	    String imageData = parts.length > 1 ? parts[1] : parts[0];

	    // 파일 확장자 추출
	    String extension = "";
	    int extensionIndex = originalFilename.lastIndexOf(".");
	    if (extensionIndex > 0) {
	        extension = originalFilename.substring(extensionIndex);
	    }

	    // 고유한 파일명 생성
	    String filename = UUID.randomUUID().toString() + extension;
	    
	    // 업로드 디렉토리 생성
	    File directory = new File(uploadDir);
	    if (!directory.exists()) {
	        directory.mkdirs();
	    }

	    // 파일 경로 생성
	    String filePath = uploadDir + File.separator + filename;

	    // Base64 디코딩 및 파일 저장
	    try {
	        byte[] imageBytes = Base64.getDecoder().decode(imageData);
	        Files.write(Paths.get(filePath), imageBytes);
	    } catch (IOException e) {
	        throw new Exception("Failed to save image file", e);
	    }

	    return filename;
	}
	
	/**
     * 공연 설명 이미지 업로드
     */
	@PostMapping("/description/upload")
	public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
	    try {
	        // 원본 파일명에서 확장자 추출
	        String originalFilename = file.getOriginalFilename();
	        String extension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
	        
	        // 새로운 파일명 생성
	        String newFileName = UUID.randomUUID().toString() + extension;

	        // 저장 경로 생성
	        Path uploadPath = Paths.get(performanceLocation);
	        
	        // 디렉토리가 없으면 생성
	        if (!Files.exists(uploadPath)) {
	            Files.createDirectories(uploadPath);
	        }
	        
	        // 파일 저장 경로 생성
	        Path filePath = uploadPath.resolve(newFileName);
	        log.info("File will be saved to: {}", filePath.toString());
	        
	        // Files.copy를 사용하여 파일 저장
	        Files.copy(file.getInputStream(), filePath);

	        // 이미지 URL 생성
	        String imageUrl = resourceHandler.replace("/**", "/") + newFileName;
	        log.info("Image URL created: {}", imageUrl);
	        
	        return ResponseEntity.ok(Map.of("url", imageUrl));

	    } catch (IOException e) {
	        log.error("File upload failed", e);
	        return ResponseEntity
	                .status(HttpStatus.INTERNAL_SERVER_ERROR)
	                .body(Map.of("error", "이미지 업로드에 실패했습니다."));
	    }
	}

    /**
     * 공연 설명 이미지 삭제
     */
    @DeleteMapping("/description/delete")
    public ResponseEntity<Map<String, String>> deleteImage(@RequestParam("imageUrl") String imageUrl) {
        try {
            // URL에서 파일명 추출
            String fileName = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);
            
            // 파일 경로 생성
            Path filePath = Paths.get(performanceLocation, fileName);
            log.info("Attempting to delete file: {}", filePath.toString());

            // 파일 존재 여부 확인
            if (!Files.exists(filePath)) {
                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "파일을 찾을 수 없습니다."));
            }

            // 파일 삭제
            Files.delete(filePath);
            return ResponseEntity.ok(Map.of("message", "이미지가 성공적으로 삭제되었습니다."));

        } catch (IOException e) {
            log.error("File deletion failed", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "이미지 삭제에 실패했습니다."));
        }
    }
	

	/**
	 * 관리자 공연 등록 -> 공연장 이름 또는 주소 검색시 공연장 목록 가져오기
	 * 
	 * @param keyword
	 * @return
	 * @author 우수민
	 */
	@GetMapping("/venue/list")
	@ResponseBody
	public ResponseEntity<List<Map<String, Object>>> venueListPerformances(
			@RequestParam(value = "keyword", required = false) String keyword) {
		try {
			// 모든 공연장 목록
			List<Map<String, Object>> allVenues = performanceService.getVenueList(); // 공연장 목록을 가져오는 메서드 필요

			// 검색어가 비어있지 않은 경우 필터링

			if (!keyword.isEmpty()) {
				allVenues = allVenues.stream().filter(venue -> String.valueOf(venue.get("FCLTYNM")).contains(keyword) || // 공연장
																															// 이름으로
																															// 검색
						String.valueOf(venue.get("ADRES")).contains(keyword) // 주소로 검색
				).collect(Collectors.toList());
			}

			return ResponseEntity.ok(allVenues);

		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
		}
	}

}
