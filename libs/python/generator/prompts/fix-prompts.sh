#!/bin/bash
# Fix all remaining old icon format references in prompts

cd "$(dirname "$0")"

echo "Fixing widget2dsl-sf-lucide.md..."
sed -i 's/"lucide:Check"/"lu:LuCheck"/g' widget2dsl/widget2dsl-sf-lucide.md
sed -i 's/`lucide:` for Lucide/`lu:` for Lucide/g' widget2dsl/widget2dsl-sf-lucide.md
sed -i 's/"lucide:Sun"/"lu:LuSun"/g' widget2dsl/widget2dsl-sf-lucide.md
sed -i 's/"lucide:ArrowRight"/"lu:LuArrowRight"/g' widget2dsl/widget2dsl-sf-lucide.md
sed -i 's/`lucide:` prefix/`lu:` prefix/g' widget2dsl/widget2dsl-sf-lucide.md
sed -i 's/lucide:IconName/lu:LuIconName/g' widget2dsl/widget2dsl-sf-lucide.md
sed -i 's/"sf:checkmark\.circle\.fill"/"sf:SfCheckmarkCircleFill"/g' widget2dsl/widget2dsl-sf-lucide.md
sed -i 's/"sf:calendar"/"sf:SfCalendar"/g' widget2dsl/widget2dsl-sf-lucide.md
sed -i 's/"sf:bolt\.fill"/"sf:SfBoltFill"/g' widget2dsl/widget2dsl-sf-lucide.md
sed -i 's/"sf:star\.fill"/"sf:SfStarFill"/g' widget2dsl/widget2dsl-sf-lucide.md
sed -i 's/lowercase with dots/PascalCase with Sf prefix/g' widget2dsl/widget2dsl-sf-lucide.md
sed -i 's/sf:icon\.name/sf:SfIconName/g' widget2dsl/widget2dsl-sf-lucide.md

echo "Fixing prompt2dsl-sf-lucide.md..."
sed -i 's/`lucide:` for Lucide/`lu:` for Lucide/g' prompt2dsl/prompt2dsl-sf-lucide.md
sed -i 's/"lucide:Sun"/"lu:LuSun"/g' prompt2dsl/prompt2dsl-sf-lucide.md
sed -i 's/"lucide:ArrowRight"/"lu:LuArrowRight"/g' prompt2dsl/prompt2dsl-sf-lucide.md
sed -i 's/`lucide:` prefix/`lu:` prefix/g' prompt2dsl/prompt2dsl-sf-lucide.md
sed -i 's/lucide:IconName/lu:LuIconName/g' prompt2dsl/prompt2dsl-sf-lucide.md
sed -i 's/sf:icon\.name/sf:SfIconName/g' prompt2dsl/prompt2dsl-sf-lucide.md
sed -i 's/lowercase with dots/PascalCase with Sf prefix/g' prompt2dsl/prompt2dsl-sf-lucide.md

echo "✅ Done!"
