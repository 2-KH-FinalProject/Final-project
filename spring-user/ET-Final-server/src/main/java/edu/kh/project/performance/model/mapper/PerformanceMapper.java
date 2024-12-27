package edu.kh.project.performance.model.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;

import edu.kh.project.performance.model.dto.Performance;

@Mapper
public interface PerformanceMapper {

	/** 장르별 공연 목록 조회
	 * @param genre
	 * @return
	 * @author 우수민
	 */
	List<Performance> genre(String genre);

	/** 공연 상세페이지 조회
	 * @param mt20id
	 * @return
	 * @author 우수민
	 */
	Performance detail(String mt20id);

	/** 스케줄 및 잔여 좌석 조회
	 * @param mt20id
	 * @return
	 */
	List<Map<String, Object>> getScheduleData(String mt20id);

}
