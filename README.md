# DigNeeds Open

DigNeeds 的公开研究方法、规则说明、可复用 Skill 和示例。

这个仓库是从 DigNeeds 线上应用中抽出的公开研究层，目标是让别人可以复用“如何从 Reddit 讨论中找需求线索”的方法和真正执行规则。它不是线上网站的完整源码，也不包含账户、额度、数据库、支付、密钥、部署配置或页面代码。

## 快速开始

需要 Node.js 20 或更高版本：

```sh
npm test
npm run example
```

直接调用规则：

```js
import { analyzePosts, collectPosts } from './src/research.js';

const posts = collectPosts(upstreamResponse);
const report = analyzePosts(posts, 'portable blender');
```

## 仓库内容

- [`src/research.js`](src/research.js)：从原项目抽取的实际执行规则代码。
- [`docs/methodology.md`](docs/methodology.md)：研究方法、流程与证据边界。
- [`docs/rules.md`](docs/rules.md)：输入输出、信号词、相关性和排除规则。
- [`skills/digneeds-demand-research/SKILL.md`](skills/digneeds-demand-research/SKILL.md)：可复用的 Agent Skill。
- [`examples/`](examples/)：脱敏的 portable blender 示例和运行脚本。
- [`tests/`](tests/)：覆盖去重、URL 校验、相关性、信号、主题、促销剔除和历史重算的测试。

## 方法声明

结果是公开讨论中的研究线索，不是代表性市场样本、市场规模、销量预测或投资建议。每个标签都应回到原帖核查；没有匹配时返回空证据，不使用模拟内容填充。

## 来源与边界

规则代码源自 DigNeeds 私有线上项目的研究模块，经过公开范围整理。线上产品的 Worker、D1 schema、账户/恢复码、限流、TikHub/Waffo 配置、站点页面和部署记录没有放入本仓库。

## License

MIT，见 [`LICENSE`](LICENSE)。
