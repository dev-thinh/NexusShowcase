# Chẩn đoán chuyển trang và tải dữ liệu

Phạm vi: đọc source hiện tại, kiểm tra trình duyệt Chromium vào ứng dụng đang chạy tại localhost:3000, khách chưa đăng nhập. Không sửa source, không thay dữ liệu. DB hiện tại có 1 user, 20 công trình. Các số dưới đây là quan sát cục bộ, không phải benchmark production hoặc số liệu p95.

## Điểm nghẽn đã tái hiện

`src/app/(shell)/(site)/home-sections.tsx` khai báo `use server`, xuất hai loader đọc dữ liệu. `src/shared/ui/deferred-section.tsx:17` gọi chúng từ client. Chúng đi qua hàng đợi Server Actions của App Router, thay vì hai request đọc độc lập.

Thử nghiệm trình duyệt giữ request POST đầu tiên, sau đó cuộn tới cả featured và members:

- Cả hai section đều chuyển sang `data-state=loading`.
- Sau hơn một giây vẫn chỉ có một POST được gửi. POST tiếp theo chỉ xuất hiện sau khi thả POST đầu, cách POST đầu khoảng 1.5 giây trong phép thử có chủ động giữ mạng.
- Vì vậy, một loader chậm có thể giữ loader còn lại trong hàng đợi. Khoảng chờ nhân tạo này dùng để chứng minh sự phụ thuộc, không phải thời gian server tự xử lý.
- Mã framework đã cài cũng xác nhận: `node_modules/next/dist/client/components/app-router-instance.js` đưa action mới vào cuối queue khi đã có action pending. Navigation được ưu tiên riêng; không được suy ra mọi chuyển trang đều bị Server Action chặn.

## Cơ chế khiến loading kéo dài

`DeferredSection` dòng 12–20 không có deadline. Khi `load()` còn pending, catch/finally chưa chạy; `inFlight` vẫn true, section chỉ hiện fallback, nút thử lại chỉ có khi promise reject. Do đó request không kết thúc có thể làm section loading kéo dài mà không có lối khôi phục ở cấp component. Việc không có deadline xác nhận từ source; chưa tái hiện một request thực tự treo vô hạn.

`NavigationContent` dòng 14 ẩn toàn bộ children khi có destination. `NavigationTransitionProvider` dòng 26–30 xóa destination khi được finish hoặc pathname khớp. Cơ chế này thay nội dung bằng skeleton nhưng không làm dữ liệu trả nhanh hơn; khi request chuyển trang còn pending, người dùng mất nội dung đang xem. Chưa tái hiện lỗi kẹt destination sau một navigation đã hoàn tất.

## Các đoạn làm thời gian chờ cộng dồn

- Category page: chờ session, rồi category lookup, sau đó phần kết quả mới gọi danh sách.
- `src/features/publications/server/queries.ts:20–26`: count hoàn tất rồi mới findMany. Có phụ thuộc để clamp trang theo tổng số bản ghi, nên không thể đổi đơn giản sang Promise.all mà bỏ qua hành vi phân trang.
- Khi đăng nhập, JWT callback tại `src/features/identity/server/auth.ts:81` kiểm tra user trong DB. Đây là kiểm tra tính hợp lệ tài khoản; chưa có số đo phiên đăng nhập để kết luận nó là thủ phạm.

Các đoạn trên là đường chờ trong source, chưa phải bằng chứng truy vấn DB chậm.

## Số đo không giữ mạng

Truy vấn trực tiếp, chỉ đọc: SELECT 1 lần đầu 28 ms; hai lần sau 2 ms; category lookup 4 ms; hai phép count chạy song song tổng 15 ms.

Trình duyệt qua hai vòng chuyển tab: dữ liệu members xuất hiện khoảng 597/901 ms; robotics 526/541 ms; nghiên cứu 484/484 ms. Số này tính từ trước thao tác click Playwright tới khi article đầu hiện, có cả chi phí thao tác trình duyệt. POST featured hoàn tất khoảng 123–142 ms, body RSC khoảng 32 KB. Truy cập trực tiếp lần khảo sát đầu có featured khoảng 1288 ms, members khoảng 322 ms tính từ thao tác cuộn.

Không tái hiện được tình trạng toàn hệ thống treo hoặc chờ hàng chục giây trong lượt chạy bình thường. Chưa kiểm tra phiên đăng nhập, tải đồng thời nhiều người hoặc môi trường triển khai bên ngoài.

## Thứ tự xử lý đề xuất

1. Tách hai tác vụ đọc theo viewport khỏi hàng đợi Server Actions, giữ nguyên session và visibility. Đo lại với request đầu bị giữ để xác nhận request sau chạy độc lập.
2. Bổ sung deadline/trạng thái phục hồi; nếu dùng fetch riêng thì hủy request khi unmount. Chỉ Promise.race phía UI không giải phóng action đang nằm trong queue.
3. Đo request thực gây chậm theo từng chặng auth/query/render trước khi thay chính sách cache hoặc index. Kiểm tra riêng tài khoản đăng nhập và môi trường mà người dùng gặp lỗi.

Các báo cáo refactor trước đó và kết quả test cũ không được dùng thay cho số đo của lượt điều tra này.

## Bản sửa sau khi được yêu cầu triển khai

- Hai section dùng GET `/api/home?section=featured|members` độc lập, kiểm tra session/visibility phía server và trả `Cache-Control: private, no-store`.
- Request đọc có deadline 15 giây, nút thử lại khi lỗi và AbortController khi unmount. Kết quả request cũ không ghi đè request mới.
- Tab công khai dùng destination pending để tô nền ngay khi bấm; `aria-current` vẫn phản ánh route đã commit. Bỏ transition màu của tab để tránh hai nhịp hiển thị.
- Kiểm chứng mới: 389 unit tests toàn bộ suite và thêm 5 API tests đều qua; TypeScript, kiểm tra kiến trúc và unused checks qua. Production build riêng `.next-harness` qua. Cả 9 browser tests trong home-deferred, navigation và detail-navigation qua, không retry: có giữ request đầu, timeout/thử lại, rời trang, nền tab đổi ngay khi response bị trì hoãn, history và Ctrl-click.
- Chưa đo benchmark tải đồng thời hoặc xác nhận độ trễ ở môi trường triển khai của người dùng. Build kiểm tra tách riêng không thay thế build của server ứng dụng đang chạy.
