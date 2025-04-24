package com.golden_dobakhe.HakPle.domain.resource.image.service;

import com.golden_dobakhe.HakPle.domain.post.post.entity.Board;
import com.golden_dobakhe.HakPle.domain.post.post.repository.BoardRepository;
import com.golden_dobakhe.HakPle.domain.resource.image.entity.Image;
import com.golden_dobakhe.HakPle.domain.resource.image.repository.ImageRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.CannedAccessControlList;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.amazonaws.services.s3.model.DeleteObjectRequest;
import com.amazonaws.services.s3.model.CopyObjectRequest;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 파일(주로 이미지) 업로드, 관리, 삭제 로직을 처리하는 서비스 클래스.
 * AWS S3를 스토리지로 사용합니다.
 */
@Service
public class FileService {

    private final ImageRepository imageRepository;
    private final BoardRepository boardRepository;
    private final AmazonS3 amazonS3;

    // Logger 추가
    private static final Logger log = LoggerFactory.getLogger(FileService.class);

    @Value("${cloud.aws.s3.bucket}")
    private String bucketName;
    
    public FileService(ImageRepository imageRepository, BoardRepository boardRepository, AmazonS3 amazonS3) {
        this.imageRepository = imageRepository;
        this.boardRepository = boardRepository;
        this.amazonS3 = amazonS3;
    }

    /**
     * 파일을 S3 임시 경로에 업로드하고, 필요시 DB에 임시 이미지 정보를 저장합니다.
     *
     * @param file 업로드할 MultipartFile 객체
     * @param saveEntity DB에 Image 엔티티를 저장할지 여부
     * @param boardId 연결할 게시글 ID (선택 사항)
     * @param tempId 이미지 구분을 위한 임시 ID (UUID)
     * @return 저장된 파일의 S3 URL, 임시 ID, (저장된 경우) Image ID를 포함하는 Map
     * @throws RuntimeException 파일 저장 실패 시
     */
    @Transactional
    public Map<String, Object> saveFileWithTempId(MultipartFile file, boolean saveEntity, Long boardId, String tempId) {
        try {
            // S3에 저장할 고유 파일명 생성 (원본 파일명 + UUID)
            String fileName = generateFileName(file);
            // S3 내 임시 저장 경로 설정 (예: temp/image.jpg)
            String s3Key = "temp/" + fileName;

            // S3 업로드 시 필요한 메타데이터 설정 (파일 크기, 콘텐츠 타입)
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentLength(file.getSize());
            metadata.setContentType(file.getContentType());

            // S3 버킷에 파일 업로드 (PublicRead 권한: 누구나 URL로 접근 가능)
            amazonS3.putObject(new PutObjectRequest(bucketName, s3Key, file.getInputStream(), metadata)
                    .withCannedAcl(CannedAccessControlList.PublicRead));

            // 업로드된 파일의 S3 URL 생성
            String fileUrl = amazonS3.getUrl(bucketName, s3Key).toString();
            log.info("Uploaded temp file to S3: {}", fileUrl);

            Long imageId = null; // DB에 저장된 Image ID
            // saveEntity 플래그가 true일 경우 DB에 이미지 정보 저장
            if (saveEntity) {
                // Image 엔티티 생성 (임시 상태)
                Image image = Image.builder()
                    .filePath(fileUrl) // S3 URL 저장
                    .tempId(tempId) // 임시 ID 저장
                    .isTemp(true) // 임시 파일 플래그
                    .isDeleted(false) // 삭제 플래그
                    .build();

                // boardId가 제공되면 게시글과 연결 시도
                if (boardId != null) {
                    Optional<Board> boardOpt = boardRepository.findById(boardId);
                    if (boardOpt.isPresent()) {
                        image.setBoard(boardOpt.get());
                    } else {
                        log.warn("Board not found for ID: {}, image will not be associated.", boardId);
                    }
                }

                // Image 엔티티 DB 저장
                Image savedImage = imageRepository.save(image);
                imageId = savedImage.getId();
                log.info("Saved temp image entity to DB with ID: {}", imageId);
            }

            // 클라이언트에게 반환할 결과 데이터 구성
            Map<String, Object> result = new HashMap<>();
            result.put("filePath", fileUrl); // 이전 버전 호환성을 위해 유지
            result.put("url", fileUrl);      // 실제 사용하는 파일 URL
            result.put("tempId", tempId);    // 임시 ID
            if (imageId != null) {
                result.put("imageId", imageId); // DB ID (저장된 경우)
            }

            return result;
        } catch (IOException e) {
            log.error("Failed to save file to S3 or DB: {}", e.getMessage(), e);
            // 파일 저장 실패 시 런타임 예외 발생
            throw new RuntimeException("파일 저장 실패: " + e.getMessage(), e);
        }
    }
    
    /**
     * S3 임시 이미지들을 게시글에 연결하고 영구 경로로 이동합니다.
     */
    @Transactional
    public int linkImagesToBoard(List<String> tempIds, Long boardId) {
        if (tempIds == null || tempIds.isEmpty() || boardId == null) {
            return 0;
        }
        
        // 게시글 존재 확인
        if (!boardRepository.existsById(boardId)) {
            throw new RuntimeException("게시글이 존재하지 않습니다: " + boardId);
        }
        
        // 임시 이미지 목록 조회
        List<Image> images = imageRepository.findByTempIdIn(tempIds);
        Board board = boardRepository.findById(boardId).orElseThrow();
        
        // 각 이미지에 대해 S3 객체 이동 및 DB 업데이트
        for (Image image : images) {
            try {
                String tempS3Url = image.getFilePath();
                String tempS3Key = extractS3KeyFromUrl(tempS3Url); // URL에서 S3 키 추출
                String fileName = tempS3Key.substring(tempS3Key.lastIndexOf('/') + 1);
                String permanentS3Key = "board/" + boardId + "/" + fileName; // 영구 경로 생성

                // S3 객체 복사 (temp -> permanent)
                CopyObjectRequest copyReq = new CopyObjectRequest(bucketName, tempS3Key, bucketName, permanentS3Key)
                        .withCannedAccessControlList(CannedAccessControlList.PublicRead); // 복사본도 PublicRead
                amazonS3.copyObject(copyReq);

                // 원본 임시 S3 객체 삭제
                amazonS3.deleteObject(new DeleteObjectRequest(bucketName, tempS3Key));

                // DB 업데이트: 새 URL, isTemp=false, board 연결
                String permanentS3Url = amazonS3.getUrl(bucketName, permanentS3Key).toString();
                image.setFilePath(permanentS3Url);
                image.setBoard(board);
                image.setIsTemp(false);

            } catch (Exception e) {
                // 개별 이미지 처리 실패 시 로그 남기고 계속 진행 (선택적)
                log.error("S3 이미지 이동/삭제 또는 DB 업데이트 실패 (tempId: {}, boardId: {}): {}", 
                          image.getTempId(), boardId, e.getMessage());
                // 실패한 이미지는 어떻게 처리할지 정책 결정 필요 (예: DB 롤백하지 않고 실패 로그만 남김)
            }
        }
        
        // 변경된 이미지 저장
        imageRepository.saveAll(images); // 성공적으로 처리된 이미지만 저장됨
        
        return images.size(); // 처리 시도한 이미지 개수 반환
    }
    
    /**
     * 임시 S3 이미지 삭제 (DB + S3 객체)
     */
    @Transactional
    public void deleteTempImages(List<String> tempIds) {
        if (tempIds == null || tempIds.isEmpty()) return;
        List<Image> images = imageRepository.findByTempIdIn(tempIds);
        for (Image img : images) {
            // S3 URL에서 키 추출 및 삭제
            String s3Key = extractS3KeyFromUrl(img.getFilePath());
            if (s3Key != null && s3Key.startsWith("temp/")) { // 임시 경로 확인
                amazonS3.deleteObject(new DeleteObjectRequest(bucketName, s3Key));
                log.info("Deleted temp S3 object: {}", s3Key);
            } else {
                log.warn("Skipping delete for non-temp or invalid S3 key: {}", s3Key);
            }
            imageRepository.delete(img);
        }
    }

    /**
     * 글 수정 후 사용되지 않는 이미지 정리 (DB + S3 객체)
     */
    @Transactional
    public void cleanUpUnused(Long boardId, List<String> usedUrls) {
        if (boardId == null) return;
        List<Image> images = imageRepository.findByBoardId(boardId);
        Set<String> usedUrlSet = new HashSet<>(usedUrls != null ? usedUrls : List.of()); // Null-safe Set

        for (Image img : images) {
            // isTemp가 false이고(연결된 이미지), 사용 목록에 없는 경우 삭제
            if (Boolean.FALSE.equals(img.getIsTemp()) && !usedUrlSet.contains(img.getFilePath())) {
                try {
                    // S3 URL에서 키 추출 및 삭제 (영구 경로에서)
                    String s3Key = extractS3KeyFromUrl(img.getFilePath());
                    if (s3Key != null && s3Key.startsWith("board/")) { // 영구 경로 확인
                        amazonS3.deleteObject(new DeleteObjectRequest(bucketName, s3Key));
                        log.info("Deleted unused S3 object: {}", s3Key);
                    } else {
                         log.warn("Skipping delete for non-board or invalid S3 key: {}", s3Key);
                    }
                } catch (Exception ignored) {}
                imageRepository.delete(img);
            }
        }
    }

    /**
     * 글 저장 전: 지정된 tempId와 콘텐츠에 포함된 URL을 제외한 임시 S3 이미지 삭제 (DB + S3 객체)
     */
    @Transactional
    public void cleanTempImagesNotIn(List<String> keepTempIds, String content) {
        // 콘텐츠에서 사용된 URL 추출
        Set<String> usedUrls = new HashSet<>();
        if (content != null) {
            Pattern pattern = Pattern.compile("<img[^>]+src=[\\\"']([^\\\"']+)[\\\"']");
            Matcher matcher = pattern.matcher(content);
            while (matcher.find()) {
                usedUrls.add(matcher.group(1));
            }
        }
        // DB에서 임시 이미지 조회
        List<Image> temps = imageRepository.findByBoardIsNull();
        for (Image img : temps) {
            if (Boolean.TRUE.equals(img.getIsTemp())) {
                boolean keepById = keepTempIds != null && keepTempIds.contains(img.getTempId());
                boolean keepByUrl = usedUrls.contains(img.getFilePath());
                if (!keepById && !keepByUrl) {
                    try {
                        // S3 URL에서 키 추출 및 삭제 (임시 경로에서)
                        String s3Key = extractS3KeyFromUrl(img.getFilePath());
                        if (s3Key != null && s3Key.startsWith("temp/")) { // 임시 경로 확인
                            amazonS3.deleteObject(new DeleteObjectRequest(bucketName, s3Key));
                            log.info("Cleaned up unused temp S3 object: {}", s3Key);
                        } else {
                            log.warn("Skipping cleanup for non-temp or invalid S3 key: {}", s3Key);
                        }
                    } catch (Exception ignored) {}
                    imageRepository.delete(img);
                }
            }
        }
    }

    /**
     * S3 URL에서 객체 키(경로)를 추출하는 헬퍼 메서드
     */
    private String extractS3KeyFromUrl(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty()) {
            return null;
        }
        try {
            // 일반적인 S3 URL 형식 (https://<bucket-name>.s3.<region>.amazonaws.com/<key>)
            // 또는 (https://<bucket-name>.s3.amazonaws.com/<key>) - 리전 없을 경우
            String prefix1 = "https://" + bucketName + ".s3." + amazonS3.getRegionName() + ".amazonaws.com/";
            String prefix2 = "https://" + bucketName + ".s3.amazonaws.com/";

            String key = null;
            if (fileUrl.startsWith(prefix1)) {
                key = fileUrl.substring(prefix1.length());
            } else if (fileUrl.startsWith(prefix2)) {
                key = fileUrl.substring(prefix2.length());
            }

            if (key != null) {
                return URLDecoder.decode(key, StandardCharsets.UTF_8);
            }
        } catch (Exception e) {
            log.error("Failed to extract S3 key from URL: {}", fileUrl, e);
        }
        return null; // 추출 실패 시 null 반환
    }

    // 파일명 생성
    private String generateFileName(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        
        return UUID.randomUUID().toString() + extension;
    }
}
