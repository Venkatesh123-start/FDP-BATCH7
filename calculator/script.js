let displayEl = document.getElementById('display');
let historyEl = document.getElementById('history');
let angleDeg = true;
let memory = 0;
let history = [];
let lastResult = null;

function updateDisplay(v){ 
  displayEl.textContent = v;
  updateMemoryIndicator();
}

function formatNumber(num){
  if(typeof num !== 'number' || isNaN(num)) return num;
  if(!isFinite(num)) return num > 0 ? '∞' : '-∞';
  if(Math.abs(num) < 1e-10 && num !== 0) return num.toExponential(4);
  if(Math.abs(num) > 1e10) return num.toExponential(4);
  return parseFloat(num.toPrecision(12));
}

function pushHistory(expr, result){ 
  history.push(expr + ' = ' + result); 
  historyEl.textContent = history.slice(-3).join(' | ');
}

function updateMemoryIndicator(){
  const indicator = document.getElementById('memIndicator');
  if(indicator) indicator.style.opacity = memory !== 0 ? '1' : '0';
}

function fact(n){ 
  n = Math.floor(n); 
  if(n < 0) return NaN; 
  if(n > 170) return Infinity;
  let r = 1; 
  for(let i = 2; i <= n; i++) r *= i; 
  return r;
}

function sin(x){ return angleDeg ? Math.sin(x*Math.PI/180) : Math.sin(x) }
function cos(x){ return angleDeg ? Math.cos(x*Math.PI/180) : Math.cos(x) }
function tan(x){ return angleDeg ? Math.tan(x*Math.PI/180) : Math.tan(x) }

function sanitize(expr){ 
  // Replace operators
  expr = expr.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-');
  
  // Handle constants - wrap in parens for implicit multiplication
  expr = expr.replace(/π/g,'(Math.PI)');
  expr = expr.replace(/(^|[^a-zA-Z])e($|[^a-zA-Z])/g,'$1(Math.E)$2');
  
  // Handle percentage
  expr = expr.replace(/([0-9\.]+)%/g,'($1/100)');
  
  // Handle factorial
  expr = expr.replace(/([0-9\.]+)!/g,'fact($1)');
  
  // Handle power operator
  expr = expr.replace(/\^/g,'**');
  
  // Replace function names with Math equivalents
  // Match function name followed by opening parenthesis
  expr = expr.replace(/sqrt\(/g,'Math.sqrt(');
  expr = expr.replace(/abs\(/g,'Math.abs(');
  expr = expr.replace(/ln\(/g,'Math.log(');
  expr = expr.replace(/log\(/g,'Math.log10(');
  expr = expr.replace(/exp\(/g,'Math.exp(');
  expr = expr.replace(/sin\(/g,'sin(');
  expr = expr.replace(/cos\(/g,'cos(');
  expr = expr.replace(/tan\(/g,'tan(');
  
  return expr;
}

function safeEval(expr){
  if(!expr || expr === '0') return 0;
  
  expr = sanitize(expr);
  
  // Validate expression only contains safe characters
  if(!/^[0-9\.\+\-\*\/\(\)\,\s]*$/i.test(expr.replace(/Math\.(PI|E|sqrt|abs|log10|log|exp|sin|cos|tan|pow)/g,'').replace(/fact/g,'').replace(/sin|cos|tan/g,''))){
    return 'Error';
  }
  
  try{ 
    const result = Function('sin','cos','tan','fact','Math','return ('+expr+')')(sin,cos,tan,fact,Math);
    if(typeof result === 'number'){
      if(isNaN(result)) return 'Error';
      return formatNumber(result);
    }
    return result;
  }
  catch(e){ 
    console.error('Eval error:', e);
    return 'Error';
  }
}

document.addEventListener('click', e=>{
  let btn = e.target.closest('button'); if(!btn) return;
  let val = btn.dataset.value; let action = btn.dataset.action;
  let current = displayEl.textContent;
  let clearBtn = document.getElementById('clearBtn');
  
  if(val){ 
    if(current === '0' || current === 'Error' || lastResult !== null){
      updateDisplay(val);
      lastResult = null;
    } else {
      // Prevent multiple decimals in same number
      if(val === '.'){
        let parts = current.split(/[\+\-\*\/\^\(]/);
        let lastPart = parts[parts.length - 1];
        if(lastPart.includes('.')) return;
      }
      updateDisplay(current + val);
    }
    if(clearBtn) clearBtn.textContent = 'C';
    return;
  }
  
  if(action){
    if(action==='clear'){ 
      updateDisplay('0'); 
      history = [];
      historyEl.textContent = ' ';
      lastResult = null;
      if(clearBtn) clearBtn.textContent = 'AC';
      return;
    }
    if(action==='back'){ 
      if(current === 'Error'){
        updateDisplay('0');
      } else {
        let newVal = current.length > 1 ? current.slice(0, -1) : '0';
        updateDisplay(newVal);
        if(newVal === '0' && clearBtn) clearBtn.textContent = 'AC';
      }
      return;
    }
    if(action==='percent'){ updateDisplay(current + '%'); return; }
    if(action==='pow'){ updateDisplay(current + '^'); return; }
    if(action==='factorial'){ updateDisplay(current + '!'); return; }
    if(action==='square'){ 
      if(current === '0' || current === 'Error') return;
      let expr = current + '^2';
      let res = safeEval(expr);
      pushHistory(expr, res);
      updateDisplay(String(res));
      lastResult = res;
      return;
    }
    if(action==='sqrt'){ 
      if(current === '0' || current === 'Error'){
        updateDisplay('sqrt(');
        lastResult = null;
      } else if(lastResult !== null){
        updateDisplay('sqrt(');
        lastResult = null;
      } else {
        // Check if last char is a number or ), if so add multiplication
        let lastChar = current.slice(-1);
        if(/[0-9)]/.test(lastChar)){
          updateDisplay(current + '*sqrt(');
        } else {
          updateDisplay(current + 'sqrt(');
        }
      }
      if(clearBtn) clearBtn.textContent = 'C';
      return;
    }
    if(action==='pi'){ 
      if(current === '0' || current === 'Error' || lastResult !== null){
        updateDisplay('π');
        lastResult = null;
      } else {
        updateDisplay(current + 'π');
      }
      return;
    }
    if(action==='e'){ 
      if(current === '0' || current === 'Error' || lastResult !== null){
        updateDisplay('e');
        lastResult = null;
      } else {
        updateDisplay(current + 'e');
      }
      return;
    }
    if(action==='ans'){ 
      if(lastResult !== null && typeof lastResult === 'number'){
        if(current === '0' || current === 'Error'){
          updateDisplay(String(lastResult));
        } else {
          updateDisplay(current + String(lastResult));
        }
      }
      return;
    }
    if(action==='equals'){ 
      let expr = current;
      if(expr === '0' || expr === 'Error') return;
      let res = safeEval(expr);
      pushHistory(expr, res);
      updateDisplay(String(res));
      lastResult = res;
      return;
    }
    if(action==='mc'){ memory = 0; updateMemoryIndicator(); return; }
    if(action==='mr'){ updateDisplay(String(memory)); lastResult = null; return; }
    if(action==='mplus'){ 
      let val = safeEval(current);
      if(val !== 'Error' && typeof val === 'number') memory += val;
      updateMemoryIndicator();
      return;
    }
    if(action==='mminus'){ 
      let val = safeEval(current);
      if(val !== 'Error' && typeof val === 'number') memory -= val;
      updateMemoryIndicator();
      return;
    }
  }
});

document.getElementById('angleToggle').addEventListener('click', function(){ angleDeg = !angleDeg; this.textContent = angleDeg ? 'Deg' : 'Rad' });

window.addEventListener('keydown', e=>{
  if(e.key === 'Enter' || e.key === '='){ 
    e.preventDefault(); 
    document.querySelector('[data-action="equals"]').click(); 
    return;
  }
  if(e.key === 'Backspace' || e.key === 'Delete'){ 
    e.preventDefault();
    document.querySelector('[data-action="back"]').click(); 
    return;
  }
  if(e.key === 'Escape'){ 
    document.querySelector('[data-action="clear"]').click(); 
    return;
  }
  if(e.key.toLowerCase() === 'c' && e.ctrlKey){ 
    return; // Allow Ctrl+C for copy
  }
  if(e.key.toLowerCase() === 'c'){ 
    document.querySelector('[data-action="clear"]').click(); 
    return;
  }
  if(e.key === '%'){ document.querySelector('[data-action="percent"]').click(); return; }
  if(e.key === '!'){ document.querySelector('[data-action="factorial"]').click(); return; }
  if(e.key.toLowerCase() === 'p' && !e.ctrlKey){ 
    e.preventDefault();
    document.querySelector('[data-action="pi"]').click(); 
    return; 
  }
  if(e.key.toLowerCase() === 'a' && !e.ctrlKey){ 
    e.preventDefault();
    document.querySelector('[data-action="ans"]').click(); 
    return; 
  }
  
  if(/^[0-9+\-*/().^]$/.test(e.key)){
    let current = displayEl.textContent;
    let clearBtn = document.getElementById('clearBtn');
    if(current === '0' || current === 'Error' || lastResult !== null){
      updateDisplay(e.key);
      lastResult = null;
    } else {
      if(e.key === '.'){
        let parts = current.split(/[\+\-\*\/\^\(]/);
        let lastPart = parts[parts.length - 1];
        if(lastPart.includes('.')) return;
      }
      updateDisplay(current + e.key);
    }
    if(clearBtn) clearBtn.textContent = 'C';
  }
});

// Initialize
updateMemoryIndicator();
