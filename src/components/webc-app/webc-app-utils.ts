function trim(path) {
  return trimEnd(trimStart(path));
}

function trimStart(path = '') {
  return path.startsWith('/') ? path.slice(1) : path;
}

function trimEnd(path = '') {
  return path.endsWith('/') ? path.slice(0, -1) : path;
}

const URLHelper = {
  trim,

  trimEnd,

  trimStart,

  join: (base, ...paths) => {
    let result = new URL(trimEnd(window.location.origin) + '/');
    for (let path of paths) {
      path = trimEnd(path);
      if (path === '') continue;
      result = new URL(path + '/', result);
    }

    base = trim(base);
    if (base !== '') {
      result = new URL(base + '/' + trim(result.pathname), trim(result.origin));
    }

    return {
      href: trimEnd(result.href),
      pathname: trimEnd(result.pathname),
    };
  },
};

export { URLHelper };
