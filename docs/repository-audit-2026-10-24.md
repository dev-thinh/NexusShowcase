# Rà soát repository — 24/10/2026

> Đây là kết quả audit tại thời điểm 24/10. Các phát hiện còn lại đã được xử lý trong đợt [khắc phục ngày 25/10](audit-remediation-2026-10-25.md); xem báo cáo đó để biết trạng thái hiện tại, kiểm thử và thay đổi trên môi trường thực tế.

Rà soát phiên bản đang làm việc, bao gồm các thay đổi chưa commit về ảnh, animation và điều hướng. Phạm vi: source, route/API, quyền truy cập, dữ liệu/media, dependency, script kiểm kê, cấu hình và kiểm thử. Không thay đổi dữ liệu DB, không xóa media local/ImageKit, không tự nâng dependency major.

**Đã phát hiện và sửa**

| Vấn đề xác nhận được | Tác động trước khi sửa | Thay đổi |
| --- | --- | --- |
| Upload parse multipart trước xác thực; giới hạn file chỉ kiểm tra sau parse | Request chưa đăng nhập hoặc body quá lớn vẫn có thể chiếm tài nguyên trước khi bị từ chối | `src/app/api/upload/route.ts`: kiểm tra actor trước đọc body, giới hạn toàn bộ body 26 MiB gồm file tối đa 25 MiB và phần multipart. Kiểm tra cả Content-Length và số byte thực tế trong stream; trả 413 khi vượt giới hạn, 400 khi multipart không hợp lệ. Giữ nguyên validation file và quyền trong Server Action. |
| Loading điều hướng chỉ kết thúc nếu pathname thực tế trùng pathname yêu cầu | Redirect đến `/login`, hoặc quay về chính trang hiện tại, có thể để nội dung bị che vô thời hạn | `src/shared/navigation/navigation-transition.tsx`: theo dõi hoàn tất router transition và mã yêu cầu. Redirect giải phóng skeleton/chiều cao giữ chỗ; yêu cầu cũ không được dọn yêu cầu mới. Giữ thứ tự chuyển trang rồi cuộn lên. |
| Kiểm kê media bỏ sót `HomeMomentsGallery.photos` | Ảnh chỉ dùng trong mục khoảnh khắc/hướng nghiên cứu có thể bị báo nhầm là không tham chiếu | `scripts/audit-asset-references.ts`: kiểm kê toàn bộ gallery; nếu không đọc được, báo `gallery.photos` trong nguồn chưa xác minh. Script vẫn chỉ đọc. |

Giới hạn HTTP upload giúp chặn body vượt mức trong quá trình ứng dụng đọc dữ liệu; triển khai thực tế vẫn nên có giới hạn body, timeout và rate limit ở reverse proxy. Trường hợp kích thước body lớn nhưng hợp lệ vẫn có chi phí parse trong giới hạn đã cho phép.

**Đã loại bỏ phần không dùng**

- CSS không có runtime caller: `.action-row-card`, `.action-row-detail`, `.action-primary-card`, `.academic-headline`, `.academic-subhead`, `.academic-code`, `.home-hero__secondary-action` và các biến thể hover/focus tương ứng. Giữ nguyên style của nút primary đang dùng.
- Animation/keyframes `filmstrip-roll` trong `tailwind.config.ts`, không còn phần tử nào sử dụng.
- Nhánh IntersectionObserver chờ cuộn của `DeferredSection`, cùng prop `eager` và ref chỉ phục vụ nhánh đó. Sau thay đổi yêu cầu tải ảnh sớm, cả bốn nơi dùng thực tế đều tải ngay khi mount; giữ hai chế độ là thừa. Giữ loading/error/retry, abort khi rời trang và bảo vệ kết quả request cũ.
- Cập nhật kiểm thử từng buộc tồn tại các CSS đã không còn dùng; kiểm tra chiều cao nút dùng `.action-secondary-card` đang được giao diện sử dụng.

**Các điểm còn cần cải thiện — theo thứ tự ưu tiên**

| Ưu tiên | Phát hiện và bằng chứng | Đề xuất |
| --- | --- | --- |
| Cao | `npm audit --omit=dev` báo 4 mục high: `zod`, `deepmerge-ts`, `@prisma/config`, `prisma`. Đây là hai nhóm advisory, không phải bốn lỗi độc lập. Phiên bản cài: Zod 3.25.76, Prisma 6.19.3. | Lập đợt nâng cấp Zod và chuỗi dependency Prisma có bản vá, kiểm tra tương thích schema/auth/Prisma và chạy integration trước khi đổi lockfile. Không dùng `npm audit fix --force` một cách mù quáng. Chưa chứng minh khả năng khai thác trên ứng dụng. |
| Cao nếu PRIVATE cần bảo vệ file | Các route `src/app/uploads/documents/[filename]/route.ts`, `resources/[filename]/route.ts` và ImageKit public URL chưa gắn với quyền đọc bài. Document được cache public/immutable một năm. Ẩn bài không thu hồi URL file đã biết. Đây là giới hạn đã ghi trong `docs/database-operations.md`. | Chốt PRIVATE có bao gồm file đính kèm hay không. Nếu có: quản lý quyền asset, bảo vệ origin/cloud access, URL ký có hạn và chính sách cache phù hợp. Chỉ bảo vệ route ứng dụng là chưa đủ nếu URL ImageKit vẫn public. |
| Vừa | `member-commands.ts:66–89` lưu identifier nguyên hoa/thường, còn `auth.ts:41–47` tìm bằng exact/lowercase bất đối xứng. DB unique hiện phân biệt hoa/thường. `Alice` tạo trước rồi `alice` tạo sau có thể trở thành hai identifier khác nhau. | Kiểm kê xung đột identifier trước; thống nhất dạng chuẩn khi tạo/đăng nhập và bổ sung uniqueness phù hợp ở DB. Không tự lowercase toàn bộ DB khi chưa xử lý các tài khoản trùng. |
| Vừa | `password-command.ts:31–32` đổi mật khẩu chỉ với điều kiện user ID, sau khi đã đọc/so sánh hash cũ. Hai yêu cầu đồng thời dùng cùng mật khẩu cũ có thể cùng thành công, yêu cầu sau ghi đè yêu cầu trước. | Dùng cập nhật có điều kiện với password hash/phiên bản đã đọc; chỉ một yêu cầu được thành công. Bổ sung test cạnh tranh trong DB test riêng. |
| Vừa | Không thấy application-level login throttling ở `login-actions.ts`/`auth.ts`. Cấu hình rate limit của hạ tầng bên ngoài không nằm trong repo. | Kiểm tra giới hạn tại hosting; bổ sung rate limit phù hợp cho đăng nhập và upload, với lưu trữ dùng chung nếu chạy nhiều instance. |
| Vừa | `storage.ts:11–12` chỉ giữ URL sau upload và bỏ `fileId` do ImageKit trả về. Upload rồi hủy modal/xóa khỏi thư viện không đồng nghĩa file cloud được xóa. | Thêm registry asset có provider/fileId, liên kết tham chiếu và thời gian tạo. Dọn orphan sau khoảng chờ, kiểm tra cả gallery, draft và revision. Không suy ra file cloud dư chỉ từ bảng bài đang xuất bản. |
| Thấp | `PageReveal` giữ animation và element trong Map tới khi đổi route; nội dung stream/thay đổi nhiều trên cùng route có thể kéo dài vòng đời tham chiếu. Chưa đo được ảnh hưởng đáng kể. | Nếu cần tối ưu, thêm element vào settled và xóa entry khi animation hoàn tất. Đo trước/sau; tránh mở rộng animation trong đợt dọn mã. |

Nguồn xác minh dependency:

- [Zod — GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5): advisory hiện đánh dấu phiên bản trước 4.6.6 bị ảnh hưởng. Rủi ro liên quan chi phí validation collection quá lớn; cần đánh giá giới hạn đầu vào trên các đường gọi thực tế.
- [DeepmergeTS — GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx): bản vá từ 8.0.0; trường hợp mô tả cần object graph đệ quy, JSON thông thường không tự tạo điều kiện này. Việc npm báo chuỗi Prisma không chứng minh có đường khai thác từ HTTP trong repo.

**Những phần đã kiểm tra và giữ lại**

- `audit:unused`: không có file unreachable theo import graph, không có cảnh báo dynamic reference. Hai export được miễn trừ là `reopenShowcaseAction` và `archiveShowcaseAction`: chưa được UI gọi nhưng còn là contract lifecycle có kiểm thử `tests/integration/direct-approval.test.ts`; archive còn nằm trong kiểm thử cạnh tranh ghim/lưu trữ. Không xóa hành vi nghiệp vụ chỉ để làm kết quả kiểm kê trống.
- CSS hình portrait/square và role thành viên: class được tạo động từ dữ liệu, không phải code chết.
- Không tìm được dependency trực tiếp nào đủ bằng chứng để gỡ; các package hiện đều có vai trò runtime/build/test/script.
- Giữ migration, kế hoạch và báo cáo lịch sử. Tuổi của tài liệu hoặc không có import không phải bằng chứng để xóa migration/data/media.
- Giữ các cải thiện ảnh, animation và điều hướng đã được người dùng duyệt trong phiên này.

**Kết quả kiểm kê media chỉ đọc**

Đọc các bảng tham chiếu, gồm gallery sau bản sửa: 9 đường dẫn tham chiếu được nhận diện; 0 ứng viên file local không tham chiếu; nguồn chưa xác minh có `unrecognized-local-asset-path`. Kết quả này không phải inventory toàn bộ tài khoản ImageKit và không phải bảo đảm không có orphan cloud. Đã xóa 0 file và 0 bản ghi DB.

**Kiểm chứng sau thay đổi**

- `npm.cmd run check`: qua typecheck, unused gate, architecture và 499 unit test/103 file test.
- Production build qua `npm.cmd run preview -- --port 3002`: thành công.
- Trình duyệt trên production preview: redirect sang route khác và redirect quay lại route ban đầu đều hết loading; upload ẩn danh trả 403. Mô phỏng redirect bằng cách cho RSC request của một link nhận response redirect thực của `/dashboard`, không sửa DB.
- Regression upload: chặn chưa đăng nhập trước parse; chặn Content-Length quá lớn; chặn body stream vượt giới hạn dù không có Content-Length; chấp nhận multipart hợp lệ.
- Regression asset: ảnh chỉ dùng bởi gallery được giữ lại; lỗi đọc gallery đánh dấu inventory thiếu, không xóa fixture.
- `git diff --check`: không có lỗi whitespace.
- Chưa chạy lại toàn bộ integration/E2E có DB trong đợt audit này; không chạy migration trên DB ứng dụng.

Lưu ý vận hành: không chạy typecheck cùng lúc với lệnh build đang xóa/tạo lại generated types trong `.next-preview`, vì `tsconfig.json` đang include thư mục đó. Lượt chạy song song ban đầu gặp race generated-file; lượt kiểm tra tuần tự sau khi build đã qua. Đây không phải lỗi TypeScript của source.

Giới hạn phân tích tĩnh: công cụ unused hiện bảo thủ với namespace/dynamic imports, không phát hiện đầy đủ export type/class hay nhánh không thể chạy trong module còn được dùng. CSS được đối chiếu cả class sinh động và kiểm thử. Vì vậy báo cáo không khẳng định toàn bộ repo tuyệt đối không còn code chết.
