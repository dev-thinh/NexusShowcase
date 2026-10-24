# Chuyển trang trước, tải dữ liệu sau

Yêu cầu bổ sung sau refactor: thay nội dung cũ bằng skeleton trang đích ngay khi bấm link; trang chủ chỉ gọi dữ liệu section khi cuộn gần tới; nghiên cứu/robotics phân trang tại database.

Thiết kế thực hiện trong luồng hiện có, inline: dùng chung NavigationLink cho link nội bộ, giữ navbar/layout và ẩn content cũ khi destination pending. NavigationContent hiện skeleton theo destination trước response; loading boundary cho site/account tiếp quản khi route commit. Không sửa URL/history thủ công; Ctrl-click, link hash, external/new-tab và chuyển hướng xác thực tiếp tục theo Next/native browser. Không bỏ auth hoặc visibility để làm nhanh.

Trang chủ không còn khởi chạy sẵn hai query section. DeferredSection dùng IntersectionObserver với vùng chuẩn bị200px; chỉ lúc tiến gần viewport mới gọi server loader có session/visibility và giới hạn dữ liệu. Loader trả nội dung React đã render, không gửi module/query DB xuống client. Có skeleton, trạng thái lỗi/nút thử lại, chống request trùng và bỏ state update sau unmount. Khối tĩnh/hero không chờ dữ liệu section; nội dung đã tải được giữ khi cuộn qua lại trong cùng lần mount.

Danh sách giữ phân trang DB hiện có: nghiên cứu10/trang, robotics9/trang; `skip=(page-1)*pageSize`, `take=pageSize`. Ví dụ page2 dùng skip10/take10 hoặc skip9/take9. Count dùng cùng bộ lọc để tính tổng trang; không tải toàn bộ bản ghi rồi slice phía frontend. Sort có tie-breaker và page được kiểm tra/clamp; filter/search giữ trong URL.

Harness production được tách `.next-harness` sau khi xác nhận dev server đang chạy đồng thời với lỗi build `no direct app page entry found for /_not-found` trên output dùng chung. Không dừng dev server hay xóa `.next` của người dùng. Benchmark chuyển protocol2 và output mặc định mới: home đo heading tĩnh; số đo cũ giữ nguyên và không được coi tương đương với dữ liệu section tải theo viewport.

Kiểm chứng: regression skeleton và query eager được thấy RED rồi GREEN; regression build isolation cũng RED→GREEN. Full check385/385 unit trong76 file, typecheck/unused/architecture pass. Production build isolated và17/17 browser test qua, không retry. Bao gồm skeleton trang chi tiết khi response bị chặn, phản hồi dưới200ms cho tab, latest-click/history/Ctrl-click, lazy request theo cuộn và rời trang không chờ request section bị giữ. Computed style/reduced motion390/768/1440, auth/editor/duyệt/upload tiếp tục qua. Cleanup cuối0 schema/0 user-item trong template/0 thư mục harness. Chưa chạy benchmark protocol2; không đưa ra số phần trăm cải thiện mới.

Log cục bộ: `.superpowers/navigation-followup-check-final.log`, `navigation-followup-browser-isolated.log`, `navigation-followup-static-final.log`; evidence RED/GREEN giữ riêng. Không dùng lượt build lỗi output dùng chung làm bằng chứng pass. Snapshot sau task15 là baseline trước yêu cầu bổ sung; package followup giữ diff và tệp mới, không thu environment files.

Không đổi schema/seed, không reset/migrate DB ứng dụng, không thêm dependency, không commit/push/deploy. Git identity vẫn chưa có. Các báo cáo refactor trước là snapshot lịch sử trước yêu cầu bổ sung này.
