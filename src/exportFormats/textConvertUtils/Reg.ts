export const RegStore = {
    reg_mdit_head:/^((\s|>\s|-\s|\*\s|\+\s)*)(:::)\s?(.*)/,         // TODO 应该改成 `::::*`
    reg_mdit_tail:/^((\s|>\s|-\s|\*\s|\+\s)*)(:::)/,
  
    reg_mdit_head_noprefix:/^((\s)*)(:::)\s?(.*)/,
    reg_mdit_tail_noprefix:/^((\s)*)(:::)/,
    reg_emptyline_noprefix:/^\s*$/,
}