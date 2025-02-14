---
layout: post
lang: en
title: "Draft post"
subtitle: "This is a draft post to learn how to use Jekyll"
author: antaalt
date: 2023-10-07 23:45:13 -0400
image: '/assets/images/projets/inTheRain.jpg'
image-alt: 'draft'

---

This is a small and insane excerpt

# Jekyll
In order to preview jekyll, run 'bundle exec jekyll serve'.
If you want to display drafts as well (blogs u are working on), add the option --drafts

## Resources
This is how u can include an image. Note the usage of '!'

![My helpful screenshot](/assets/images/projets/aka.jpg)
And this is how you can [get the PDF](/assets/download/2022.02.cv.en.altorffer.pdf) directly.

## Formatting

Check [this link](https://www.markdownguide.org/basic-syntax/).

**Bold**

*Italic*

***Bold&Italic***

## Raw HTML

_"<strong>This</strong> is an example sentence."_ -**OP**

<div>
    <table>
        <thead>
            <tr>
                <th></th>
                <th>Test</th>
                <th>Test2</th>
                <th>Test3</th>
            </tr>
            <tr>
                <td>Value</td>
                <td>1</td>
                <td>2</td>
                <td>3</td>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td></td>
                <td>
                    <input type="checkbox">
                </td>
                <td>
                    <input type="checkbox">
                </td>
                <td>
                    <input type="checkbox">
                </td>
            </tr>
            <tr>
                <td></td>
                <td>oui</td>
                <td>oui</td>
                <td>oui</td>
            </tr>
        </tbody>
    </table>
</div>

## Latex

[Matjax](https://docs.mathjax.org/en/latest/)

This sentence uses `$` delimiters to show math inline:  $\sqrt{3x-1}+(1+x)^2$

**The Cauchy-Schwarz Inequality**

$$\left( \sum_{k=1}^n a_k b_k \right)^2 \leq \left( \sum_{k=1}^n a_k^2 \right) \left( \sum_{k=1}^n b_k^2 \right)$$


## Code

```c
int i = 0;
i = rand();
```