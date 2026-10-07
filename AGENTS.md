<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Build dashboard visualizations with the existing themed Recharts wrappers and aggregate only RLS-filtered data returned to the current user, so charts remain consistent and access-scoped.
- Keep dashboard period and aggregation logic in a pure shared module and paginate authorized reads, so date filters are testable and financial totals are not truncated.
