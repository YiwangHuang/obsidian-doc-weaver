#import "config.typ": *

#show: doc => conf(
  title: "Test",
  author: "Your name",
  doc,
)


#callout(
type: "tip",
collapse: false,
title: [等效重力场],
[
带电体在重力场和匀强电场中受到的力都是恒力，可以将这两个场合成一个场来看，*带电体在这个场中的运动*类似于*物体在重力场中的运动*。我们把合成后的场称为“等效重力场”，相应的有等效重力加速度 #mi[`g'`] 和等效重力 #mi[`mg'`]。

]
)

#callout(
type: "done",
collapse: true,
title: [答案],
[
*问题 1*


#mitex[`mgl\cos \theta - qE(l+l\sin \theta)=0\Rightarrow E=\frac{mg\cos \theta}{q(1+\sin \theta)}=\frac{mg}{\sqrt{ 3 }q}`]
*问题 2*


#mitex[`\begin{cases}
mgl-qEl=\frac{1}{2}mv_{2}^{2} \\
F-mg = m\frac{v_{2}^{2}}{l}
\end{cases}
\Rightarrow F = 3mg - \frac{2mg}{\sqrt{ 3 }}`]
*问题 3*


#mitex[`g'=\frac{g}{\cos \theta}=\frac{2}{\sqrt{ 3 }}g`]

#mitex[`\begin{cases}
mg'\frac{l}{2}=\frac{1}{2}mv_{3}^{2} \\
F_{m}-mg' = m\frac{v_{3}^{2}}{l}
\end{cases}
\Rightarrow F_{m} = 2mg'=\frac{4}{\sqrt{ 3 }}mg`]
*问题 4*

记小球在等效重力场中做圆周运动速度最小值为 #mi[`v'`]，#mi[`A`] 点的临界初速度为 #mi[`v_{4}`]


#mitex[`\begin{cases}
m\frac{v'^{2}}{l}=mg' \\
mg'\frac{3}{2}l=\frac{1}{2}m(v_{4}^{2}-v'^{2})
\end{cases}
\Rightarrow v'^{2}=4g'l \Rightarrow v'=2\sqrt{ \frac{2gl}{\sqrt{ 3 }} }`]
*问题 5*

记小球在等效重力场中刚好运动到与圆心等高时，在 #mi[`A`] 点的临界速度为 #mi[`v_{5}`]


#mitex[`mg'\frac{l}{2}=mv_{5}^{2}\Rightarrow v_{5}=\sqrt{ g'l }=\sqrt{ \frac{2gl}{\sqrt{ 3 }} }`]
#mi[`A`] 应具备的初速度 #mi[`v_{A}`] 应满足 #mi[`v_{A}<\sqrt{ \frac{2gl}{\sqrt{ 3 }} }`] 或 #mi[`v_{A}>2\sqrt{ \frac{2gl}{\sqrt{ 3 }} }`]

]
)