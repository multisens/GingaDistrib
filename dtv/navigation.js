
document.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
        e.preventDefault();
    }

    let moveup = $('.focused').attr('moveup');
    let movedown = $('.focused').attr('movedown');
    let moveleft = $('.focused').attr('moveleft');
    let moveright = $('.focused').attr('moveright');
    let select = $('.focused').attr('select');
    
    switch(e.key) {
        case 'ArrowUp':
            if (typeof moveup !== 'undefined') {
                $('.focused').removeClass('focused');
                $(`#${moveup}`).addClass('focused');
            }
            break;
        case 'ArrowDown':
            if (typeof movedown !== 'undefined') {
                $('.focused').removeClass('focused');
                $(`#${movedown}`).addClass('focused');
            }
            break;
        case 'ArrowLeft':
            if (typeof moveleft !== 'undefined') {
                $('.focused').removeClass('focused');
                $(`#${moveleft}`).addClass('focused');
            }
            break;
        case 'ArrowRight':
            if (typeof moveright !== 'undefined') {
                $('.focused').removeClass('focused');
                $(`#${moveright}`).addClass('focused');
            }
            break;
        case 'Enter':
            if (typeof select !== 'undefined') {
                window[select]();
            }
            break;
        default:
        return; // Exit if other key pressed
    }
});