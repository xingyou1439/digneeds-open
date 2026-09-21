# 规则说明

公开执行代码位于 [`src/research.js`](../src/research.js)。下面是当前 `ANALYSIS_VERSION = 3` 的行为契约，方便复用者理解结果，不必阅读线上网站代码。

## 输入与输出

```js
import { analyzePosts } from './src/research.js';

const report = analyzePosts(posts, 'portable blender', commentsByPostId);
```

`analyzePosts` 返回：

- `posts`：最多 50 条通过相关性和推广过滤的帖子；每条包含 `signals`、`commentEvidence`、`matched`、`priority`。
- `clusters`：有证据的主题及其帖子 ID、社区数、验证建议。
- `summary`：样本数、社区数、痛点数、购买线索数、有信号帖子数、评论证据数。
- `method`：面向使用者的规则边界提示。

## 需求信号

| ID | 标签 | 触发示例（英文） |
| --- | --- | --- |
| `pain` | 使用痛点 | `broke`, `leaking`, `frustrated`, `hard to clean`, `uncomfortable` |
| `recommend` | 求推荐 | `recommend`, `looking for`, `which brand`, `what is the best` |
| `alternative` | 寻找替代 | `alternative`, `replacement`, `instead of`, `better than` |
| `buy` | 购买意向线索 | `my budget`, `ready to buy`, `where can I buy`, `worth buying` |

每个标签最多保存一个触发片段，片段来自原帖文本；它不是模型生成的总结。

## 相关性与排除

- 查询词在标题或正文的同一短句中近距离出现，窗口大小为 `max(6, 查询词数量 + 3)`。
- 词元匹配完整英文单词；`blender3d` 不会匹配 `blender`。
- 常见复数会归一化，例如 `blenders` → `blender`、`dresses` → `dress`。
- URL 会从相关性匹配中移除，避免只因为链接路径包含关键词而入选。
- 没有需求信号时，若社区名或文本表现为促销/折扣，或是无正文无评论的商品 listing，则剔除。
- 有真实需求信号的帖子不会因为位于促销社区而自动剔除。

## 兼容与限制

解析器会兼容常见上游字段别名（如 `selftext`/`body`、`permalink`/`url`、`score`/`ups`），并限制递归深度、访问对象数、正文长度和评论数，避免异常响应拖垮调用方。上游抓取与速率限制不属于这个公开模块。
