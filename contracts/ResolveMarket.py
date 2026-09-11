# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
from datetime import datetime, timezone
import json


@gl.evm.contract_interface
class _Recipient:
    class View:
        pass

    class Write:
        pass


class Contract(gl.Contract):
    owner: Address
    market_count: u64

    questions: TreeMap[str, str]
    descriptions: TreeMap[str, str]
    source_urls: TreeMap[str, str]
    source_names: TreeMap[str, str]
    yes_labels: TreeMap[str, str]
    no_labels: TreeMap[str, str]
    deadlines: TreeMap[str, u64]
    yes_pools: TreeMap[str, u256]
    no_pools: TreeMap[str, u256]
    resolved: TreeMap[str, bool]
    winners: TreeMap[str, u256]
    resolution_excerpts: TreeMap[str, str]
    cancelled: TreeMap[str, bool]

    stake_yes: TreeMap[str, u256]
    stake_no: TreeMap[str, u256]
    claimed: TreeMap[str, bool]
    withdrawable: TreeMap[str, u256]

    def __init__(self):
        self.owner = gl.message.sender_address
        self.market_count = u64(0)

    def _now(self) -> u64:
        return u64(int(datetime.now(timezone.utc).timestamp()))

    def _market_key(self, market_id: u64) -> str:
        return str(market_id)

    def _stake_key(self, market_id: u64, user: str) -> str:
        return str(market_id) + ":" + user.lower()

    def _require_owner(self) -> None:
        if gl.message.sender_address != self.owner:
            raise gl.vm.UserError("owner only")

    def _require_market(self, market_id: u64) -> None:
        if market_id <= 0 or market_id > self.market_count:
            raise gl.vm.UserError("market not found")

    def _clean_str(self, value: str, field: str) -> str:
        cleaned = value.strip()
        if len(cleaned) == 0:
            raise gl.vm.UserError(field + " is required")
        return cleaned

    def _valid_url(self, url: str) -> bool:
        return url.startswith("https://") or url.startswith("http://")

    def _market_json(self, market_id: u64, full: bool) -> str:
        key = self._market_key(market_id)
        result = {
            "id": int(market_id),
            "question": self.questions[key],
            "source_url": self.source_urls[key],
            "source_name": self.source_names[key],
            "yes_label": self.yes_labels[key],
            "no_label": self.no_labels[key],
            "deadline": int(self.deadlines[key]),
            "yes_pool": str(self.yes_pools.get(key, u256(0))),
            "no_pool": str(self.no_pools.get(key, u256(0))),
            "resolved": self.resolved.get(key, False),
            "winner": int(self.winners.get(key, u256(0))),
            "cancelled": self.cancelled.get(key, False),
        }
        if full:
            result["description"] = self.descriptions[key]
            result["resolution_excerpt"] = self.resolution_excerpts.get(key, "")
        return json.dumps(result, sort_keys=True)

    @gl.public.view
    def get_owner(self) -> str:
        return self.owner.as_hex

    @gl.public.view
    def get_market_count(self) -> u64:
        return self.market_count

    @gl.public.view
    def get_market(self, market_id: u64) -> str:
        self._require_market(market_id)
        return self._market_json(market_id, True)

    @gl.public.view
    def list_markets(self) -> str:
        result = []
        current = self.market_count
        returned = 0
        while current > 0 and returned < 50:
            result.append(json.loads(self._market_json(current, False)))
            current = current - 1
            returned = returned + 1
        return json.dumps(result, sort_keys=True)

    @gl.public.view
    def get_stake(self, market_id: u64, user: str) -> str:
        self._require_market(market_id)
        key = self._stake_key(market_id, user)
        return json.dumps(
            {
                "yes": str(self.stake_yes.get(key, u256(0))),
                "no": str(self.stake_no.get(key, u256(0))),
            },
            sort_keys=True,
        )

    @gl.public.view
    def get_claimable(self, market_id: u64, user: str) -> u256:
        self._require_market(market_id)
        key = self._stake_key(market_id, user)
        if self.claimed.get(key, False):
            return 0

        market_key = self._market_key(market_id)
        user_yes = self.stake_yes.get(key, u256(0))
        user_no = self.stake_no.get(key, u256(0))

        if self.cancelled.get(market_key, False):
            return u256(user_yes + user_no)
        if not self.resolved.get(market_key, False):
            return 0

        yes_pool = self.yes_pools.get(market_key, u256(0))
        no_pool = self.no_pools.get(market_key, u256(0))
        total_pool = u256(yes_pool + no_pool)
        winner = self.winners.get(market_key, u256(0))

        winning_pool = u256(0)
        user_winning = u256(0)
        if winner == u256(1):
            winning_pool = yes_pool
            user_winning = user_yes
        elif winner == u256(2):
            winning_pool = no_pool
            user_winning = user_no

        if winning_pool == u256(0):
            return u256(user_yes + user_no)
        if user_winning == u256(0):
            return 0
        return u256(user_winning * total_pool // winning_pool)

    @gl.public.view
    def get_withdrawable(self, user: str) -> u256:
        return self.withdrawable.get(user.lower(), u256(0))

    @gl.public.view
    def is_resolved(self, market_id: u64) -> bool:
        self._require_market(market_id)
        return self.resolved.get(self._market_key(market_id), False)

    @gl.public.write
    def create_market(
        self,
        question: str,
        description: str,
        source_url: str,
        source_name: str,
        yes_label: str,
        no_label: str,
        deadline: u64,
    ) -> u64:
        self._require_owner()
        clean_question = self._clean_str(question, "question")
        clean_description = self._clean_str(description, "description")
        clean_source_url = self._clean_str(source_url, "source_url")
        clean_source_name = self._clean_str(source_name, "source_name")
        clean_yes_label = self._clean_str(yes_label, "yes_label")
        clean_no_label = self._clean_str(no_label, "no_label")
        if not self._valid_url(clean_source_url):
            raise gl.vm.UserError("source_url must be http or https")
        if deadline <= self._now():
            raise gl.vm.UserError("deadline must be in the future")

        self.market_count = u64(self.market_count + u64(1))
        market_id = self.market_count
        key = self._market_key(market_id)

        self.questions[key] = clean_question
        self.descriptions[key] = clean_description
        self.source_urls[key] = clean_source_url
        self.source_names[key] = clean_source_name
        self.yes_labels[key] = clean_yes_label
        self.no_labels[key] = clean_no_label
        self.deadlines[key] = deadline
        self.yes_pools[key] = u256(0)
        self.no_pools[key] = u256(0)
        self.resolved[key] = False
        self.winners[key] = u256(0)
        self.resolution_excerpts[key] = ""
        self.cancelled[key] = False
        return market_id

    @gl.public.write
    def cancel_market(self, market_id: u64) -> None:
        self._require_owner()
        self._require_market(market_id)
        key = self._market_key(market_id)
        if self.resolved.get(key, False):
            raise gl.vm.UserError("already resolved")
        if self.cancelled.get(key, False):
            raise gl.vm.UserError("already cancelled")
        self.cancelled[key] = True

    @gl.public.write
    def stake(self, market_id: u64, side: u8, amount: u256) -> None:
        self._require_market(market_id)
        if side != 1 and side != 2:
            raise gl.vm.UserError("side must be 1 or 2")
        value = amount
        if value <= u256(0):
            raise gl.vm.UserError("stake value required")

        market_key = self._market_key(market_id)
        if self.resolved.get(market_key, False):
            raise gl.vm.UserError("market resolved")
        if self.cancelled.get(market_key, False):
            raise gl.vm.UserError("market cancelled")
        if self._now() >= self.deadlines[market_key]:
            raise gl.vm.UserError("staking closed")

        user_key = self._stake_key(market_id, str(gl.message.sender_address))
        if side == 1:
            self.yes_pools[market_key] = u256(self.yes_pools.get(market_key, u256(0)) + value)
            self.stake_yes[user_key] = u256(self.stake_yes.get(user_key, u256(0)) + value)
        else:
            self.no_pools[market_key] = u256(self.no_pools.get(market_key, u256(0)) + value)
            self.stake_no[user_key] = u256(self.stake_no.get(user_key, u256(0)) + value)

    @gl.public.write
    def resolve(self, market_id: u64) -> None:
        self._require_market(market_id)
        market_key = self._market_key(market_id)
        if self.resolved.get(market_key, False):
            raise gl.vm.UserError("already resolved")
        if self.cancelled.get(market_key, False):
            raise gl.vm.UserError("market cancelled")
        if self._now() < self.deadlines[market_key]:
            raise gl.vm.UserError("resolve after deadline")

        source_url = self.source_urls[market_key]
        question = self.questions[market_key]
        yes_label = self.yes_labels[market_key]
        no_label = self.no_labels[market_key]

        def resolve_with_web() -> str:
            page = gl.nondet.web.render(source_url, mode="text")
            task = f"""
You are resolving a testnet prediction market using only the official page text below.
Question: {question}
Winner 1 means: {yes_label}
Winner 2 means: {no_label}
Return winner 0 if the page does not clearly state a final result or announcement.
Use only the page text. Do not use world knowledge.
Return JSON only:
{{"winner": 1 or 2 or 0, "excerpt": "short quote from the page, <= 240 chars", "reason": "one sentence"}}

Official page text:
{page[:12000]}
"""
            raw = str(gl.nondet.exec_prompt(task)).strip()
            start = raw.find("{")
            end = raw.rfind("}")
            if start < 0 or end <= start:
                return json.dumps(
                    {"winner": 0, "excerpt": "", "reason": "Resolver returned no JSON result."},
                    sort_keys=True,
                )
            try:
                parsed = json.loads(raw[start : end + 1])
            except Exception:
                return json.dumps(
                    {"winner": 0, "excerpt": "", "reason": "Resolver returned malformed JSON."},
                    sort_keys=True,
                )
            winner = parsed.get("winner", 0)
            if winner != 1 and winner != 2 and winner != 0:
                winner = 0
            excerpt = str(parsed.get("excerpt", ""))[:240]
            reason = str(parsed.get("reason", ""))[:180]
            return json.dumps(
                {"winner": winner, "excerpt": excerpt, "reason": reason},
                sort_keys=True,
            )

        result_json = json.loads(gl.eq_principle.strict_eq(resolve_with_web))
        if result_json["winner"] == 0:
            raise gl.vm.UserError("event not clearly finished on source page")

        self.resolved[market_key] = True
        self.winners[market_key] = u256(result_json["winner"])
        self.resolution_excerpts[market_key] = result_json["excerpt"]

    @gl.public.write
    def claim(self, market_id: u64) -> u256:
        self._require_market(market_id)
        user = str(gl.message.sender_address)
        key = self._stake_key(market_id, user)
        if self.claimed.get(key, False):
            raise gl.vm.UserError("already claimed")

        amount = self.get_claimable(market_id, user)
        if amount <= 0:
            raise gl.vm.UserError("nothing claimable")

        self.claimed[key] = True
        user_balance_key = user.lower()
        self.withdrawable[user_balance_key] = u256(self.withdrawable.get(user_balance_key, u256(0)) + u256(amount))
        return u256(amount)

    @gl.public.write
    def withdraw(self) -> u256:
        user = gl.message.sender_address
        user_balance_key = str(user).lower()
        amount = self.withdrawable.get(user_balance_key, u256(0))
        if amount <= u256(0):
            raise gl.vm.UserError("nothing withdrawable")
        self.withdrawable[user_balance_key] = u256(0)
        _Recipient(user).emit_transfer(value=u256(amount))
        return u256(amount)
